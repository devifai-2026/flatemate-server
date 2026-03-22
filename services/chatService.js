const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Block = require('../models/Block');
const User = require('../models/User');
const UnlockedListing = require('../models/UnlockedListing');
const AppError = require('../utils/AppError');
const profanity = require('leo-profanity');
// Add Hindi/regional slang words
profanity.add(['bhosdike', 'madarchod', 'behenchod', 'chutiya', 'gaand', 'lund', 'randi', 'saala', 'harami', 'kamina', 'chut', 'lavda', 'bsdk', 'bhenchod', 'gandu', 'chod', 'boobs', 'sexy', 'nude', 'nudes', 'sex']);

/**
 * Check if text contains profanity. Returns { hasProfanity, cleaned }.
 */
const checkAndClean = (text) => {
  if (!text) return { hasProfanity: false, cleaned: text };
  try {
    const hasProfanity = profanity.check(text);
    const cleaned = hasProfanity ? profanity.clean(text) : text;
    return { hasProfanity, cleaned };
  } catch {
    return { hasProfanity: false, cleaned: text };
  }
};

// In-memory strike tracker: `${senderId}:${recipientId}` → { count, blockedUntil }
const profanityStrikes = new Map();
const STRIKE_LIMIT = 3;
const BLOCK_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Track profanity strike. Returns { blocked, warning, strikesLeft }.
 */
const trackStrike = (senderId, recipientId) => {
  const key = `${senderId}:${recipientId}`;
  const now = Date.now();
  let record = profanityStrikes.get(key);

  // Check if currently blocked
  if (record?.blockedUntil && record.blockedUntil > now) {
    const hoursLeft = Math.ceil((record.blockedUntil - now) / (60 * 60 * 1000));
    return { blocked: true, warning: `You are blocked from messaging this user for ${hoursLeft}h due to inappropriate language.`, strikesLeft: 0 };
  }

  // Reset if block expired
  if (record?.blockedUntil && record.blockedUntil <= now) {
    record = null;
    profanityStrikes.delete(key);
  }

  if (!record) record = { count: 0, blockedUntil: null };
  record.count += 1;

  if (record.count >= STRIKE_LIMIT) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    profanityStrikes.set(key, record);
    return { blocked: true, warning: 'You have been blocked from messaging this user for 24 hours due to repeated inappropriate language.', strikesLeft: 0 };
  }

  profanityStrikes.set(key, record);
  const left = STRIKE_LIMIT - record.count;
  return { blocked: false, warning: `Inappropriate language detected. ${left} warning${left !== 1 ? 's' : ''} left before 24h block.`, strikesLeft: left };
};

/**
 * Check if sender is profanity-blocked from messaging recipient.
 */
const isProfanityBlocked = (senderId, recipientId) => {
  const key = `${senderId}:${recipientId}`;
  const record = profanityStrikes.get(key);
  if (!record?.blockedUntil) return false;
  if (record.blockedUntil > Date.now()) return true;
  // Expired — clean up
  profanityStrikes.delete(key);
  return false;
};

/**
 * Check if two users have an unlock relationship (either direction).
 * Returns true if user A unlocked a listing owned by B, or vice versa.
 * Also returns true if the conversation was created via team (group).
 */
const hasUnlockBetween = async (userA, userB) => {
  const count = await UnlockedListing.countDocuments({
    $or: [
      { user: userA, listingOwner: userB },
      { user: userB, listingOwner: userA },
    ],
  });
  return count > 0;
};

/**
 * Get all conversations with unread count.
 */
const getConversations = async (userId) => {
  const blocked = await Block.find({ $or: [{ blocker: userId }, { blocked: userId }] });
  const blockedIds = blocked.map((b) => b.blocker.toString() === userId ? b.blocked.toString() : b.blocker.toString());

  const convos = await Conversation.find({ participants: userId })
    .populate('participants', 'name phone profileImage city verified')
    .populate('team', 'name passkey')
    .sort({ updatedAt: -1 })
    .lean();

  // Add unread count to each conversation
  const withUnread = await Promise.all(
    convos.map(async (c) => {
      // For group chats, only count messages after the user joined
      const joinedAt = c.memberJoinedAt?.[userId];
      const query = {
        conversation: c._id,
        readBy: { $ne: userId },
        deletedFor: { $ne: userId },
      };
      if (joinedAt) query.createdAt = { $gte: new Date(joinedAt) };

      const unreadCount = await Message.countDocuments(query);

      if (c.isGroup) {
        return { ...c, unreadCount, isBlocked: false };
      }

      const otherUser = c.participants.find((p) => p._id.toString() !== userId);
      const isBlocked = blockedIds.includes(otherUser?._id?.toString());
      return { ...c, unreadCount, isBlocked };
    })
  );

  return withUnread;
};

/**
 * Get or create a direct conversation.
 * Requires unlock between the two users (wallet payment).
 */
const getOrCreateConversation = async (userId, receiverId) => {
  if (userId === receiverId) throw new AppError('Cannot chat with yourself', 400);

  const receiver = await User.findById(receiverId);
  if (!receiver) throw new AppError('User not found', 404);

  // Check block
  const block = await Block.findOne({
    $or: [{ blocker: userId, blocked: receiverId }, { blocker: receiverId, blocked: userId }],
  });
  if (block) throw new AppError('Cannot message this user', 403);

  // Check existing conversation first
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, receiverId], $size: 2 },
    isGroup: { $ne: true },
  });

  // If no existing conversation, require unlock before creating
  if (!conversation) {
    const unlocked = await hasUnlockBetween(userId, receiverId);
    if (!unlocked) {
      throw new AppError('Unlock this listing first to start chatting. Use tokens from your wallet.', 403);
    }
    conversation = await Conversation.create({ participants: [userId, receiverId] });
  }

  return conversation.populate('participants', 'name phone profileImage city verified');
};

/**
 * Get messages for a conversation.
 * For group chats, only return messages after the user joined.
 */
const getMessages = async (conversationId, userId, { page = 1, limit = 50 }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);

  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) throw new AppError('Not part of this conversation', 403);

  const skip = (Number(page) - 1) * Number(limit);

  // For group chats, only show messages from when user joined onwards
  const query = { conversation: conversationId, deletedFor: { $ne: userId } };
  if (conversation.isGroup) {
    const joinedAt = conversation.memberJoinedAt?.get(userId);
    if (joinedAt) query.createdAt = { $gte: joinedAt };
  }

  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Message.countDocuments(query),
  ]);

  return {
    messages: messages.reverse(),
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  };
};

/**
 * Send a message (text or media).
 * For 1-on-1 chats, requires unlock between users.
 */
const sendMessage = async (conversationId, senderId, { text, mediaType, mediaUrl, location }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);

  const isParticipant = conversation.participants.some((p) => p.toString() === senderId);
  if (!isParticipant) throw new AppError('Not part of this conversation', 403);

  let otherUserId = null;

  // For 1-on-1 chats: block check + unlock check + profanity block check
  if (!conversation.isGroup) {
    otherUserId = conversation.participants.find((p) => p.toString() !== senderId)?.toString();
    const block = await Block.findOne({
      $or: [{ blocker: senderId, blocked: otherUserId }, { blocker: otherUserId, blocked: senderId }],
    });
    if (block) throw new AppError('Cannot message this user', 403);

    // Check profanity block
    if (isProfanityBlocked(senderId, otherUserId)) {
      throw new AppError('You are blocked from messaging this user for 24 hours due to inappropriate language.', 403);
    }

    // Verify unlock exists
    const unlocked = await hasUnlockBetween(senderId, otherUserId);
    if (!unlocked) {
      throw new AppError('Unlock this listing first to chat. Use tokens from your wallet.', 403);
    }
  }

  // Check profanity + track strikes
  const { hasProfanity, cleaned } = checkAndClean(text);
  let profanityWarning = null;

  if (hasProfanity && otherUserId) {
    const strike = trackStrike(senderId, otherUserId);
    profanityWarning = strike.warning;
    if (strike.blocked && strike.strikesLeft === 0) {
      throw new AppError(strike.warning, 403);
    }
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text: cleaned || '',
    mediaType: mediaType || 'text',
    mediaUrl: mediaUrl || undefined,
    location: mediaType === 'location' ? location : undefined,
    readBy: [senderId],
  });

  // Use cleaned text for preview too
  let previewText = cleaned;
  if (mediaType === 'location') previewText = '📍 Location';
  else if (mediaType && mediaType !== 'text') previewText = `📎 ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`;

  conversation.lastMessage = { text: previewText, sender: senderId, sentAt: message.createdAt };
  await conversation.save();

  const populated = await message.populate('sender', 'name profileImage');
  // Attach warning to the returned message object so socket can forward it
  if (profanityWarning) populated._doc.profanityWarning = profanityWarning;
  return populated;
};

/**
 * Send direct message.
 */
const sendDirectMessage = async (senderId, receiverId, text) => {
  const conversation = await getOrCreateConversation(senderId, receiverId);
  const message = await sendMessage(conversation._id.toString(), senderId, { text });
  return { conversation, message };
};

/**
 * Mark all messages in conversation as read (blue double tick).
 */
const markAsRead = async (conversationId, userId) => {
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId }, $set: { status: 'read' } }
  );
};

/**
 * Mark messages as delivered (grey double tick) — called when user comes online.
 * Returns list of affected conversations and senders so socket can broadcast.
 */
const markAsDelivered = async (userId) => {
  const convos = await Conversation.find({ participants: userId }).select('_id participants');
  const convoIds = convos.map((c) => c._id);

  // Find undelivered messages to know which senders to notify
  const pendingMsgs = await Message.find(
    { conversation: { $in: convoIds }, sender: { $ne: userId }, status: 'sent' }
  ).select('conversation sender').lean();

  if (pendingMsgs.length === 0) return { updatedConversations: [] };

  // Update all to delivered
  await Message.updateMany(
    { conversation: { $in: convoIds }, sender: { $ne: userId }, status: 'sent' },
    { $set: { status: 'delivered' } }
  );

  // Group by conversation
  const convoMap = {};
  for (const msg of pendingMsgs) {
    const cid = msg.conversation.toString();
    if (!convoMap[cid]) convoMap[cid] = new Set();
    convoMap[cid].add(msg.sender.toString());
  }

  const updatedConversations = Object.entries(convoMap).map(([conversationId, senderSet]) => ({
    conversationId,
    senderIds: [...senderSet],
  }));

  return { updatedConversations };
};

/**
 * Delete a message for current user only.
 */
const deleteMessage = async (messageId, userId) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new AppError('Message not found', 404);
  msg.deletedFor.push(userId);
  await msg.save();
};

/**
 * Block a user.
 */
const blockUser = async (blockerId, blockedId) => {
  const existing = await Block.findOne({ blocker: blockerId, blocked: blockedId });
  if (existing) throw new AppError('Already blocked', 400);
  await Block.create({ blocker: blockerId, blocked: blockedId });
  return { message: 'User blocked' };
};

/**
 * Unblock a user.
 */
const unblockUser = async (blockerId, blockedId) => {
  const block = await Block.findOneAndDelete({ blocker: blockerId, blocked: blockedId });
  if (!block) throw new AppError('User not blocked', 400);
  return { message: 'User unblocked' };
};

module.exports = {
  getConversations, getOrCreateConversation, getMessages,
  sendMessage, sendDirectMessage, markAsRead, markAsDelivered,
  deleteMessage, blockUser, unblockUser,
};
