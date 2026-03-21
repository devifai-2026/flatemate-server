const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Get all conversations for a user.
 */
const getConversations = async (userId) => {
  return Conversation.find({ participants: userId })
    .populate('participants', 'name email phone profileImage')
    .populate('enquiry', 'listingType listingId paymentStatus')
    .sort({ updatedAt: -1 });
};

/**
 * Get or create a direct conversation between two users.
 * Used for direct messaging (non-enquiry chat).
 */
const getOrCreateConversation = async (userId, receiverId) => {
  if (userId === receiverId) {
    throw new AppError('Cannot start a conversation with yourself', 400);
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) throw new AppError('Receiver not found', 404);

  // Find existing conversation between these two users
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, receiverId], $size: 2 },
    enquiry: { $exists: false },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, receiverId],
    });
  }

  return conversation.populate('participants', 'name email phone profileImage');
};

/**
 * Get messages for a conversation (with pagination).
 */
const getMessages = async (conversationId, userId, { page = 1, limit = 50 }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId
  );
  if (!isParticipant) {
    throw new AppError('You are not part of this conversation', 403);
  }

  // If this conversation is linked to an enquiry, verify payment
  if (conversation.enquiry) {
    const Enquiry = require('../models/Enquiry');
    const enquiry = await Enquiry.findById(conversation.enquiry);
    if (enquiry && enquiry.paymentStatus !== 'paid') {
      throw new AppError('Payment required to chat', 402);
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversationId })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Message.countDocuments({ conversation: conversationId }),
  ]);

  return {
    messages: messages.reverse(),
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Send a message (called from Socket.io handler or REST).
 */
const sendMessage = async (conversationId, senderId, text) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError('Conversation not found', 404);

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === senderId
  );
  if (!isParticipant) {
    throw new AppError('You are not part of this conversation', 403);
  }

  // If enquiry-based, verify payment
  if (conversation.enquiry) {
    const Enquiry = require('../models/Enquiry');
    const enquiry = await Enquiry.findById(conversation.enquiry);
    if (enquiry && enquiry.paymentStatus !== 'paid') {
      throw new AppError('Payment required to chat', 402);
    }
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text,
    readBy: [senderId],
  });

  conversation.lastMessage = {
    text,
    sender: senderId,
    sentAt: message.createdAt,
  };
  await conversation.save();

  return message.populate('sender', 'name profileImage');
};

/**
 * Send a direct message to another user (creates conversation if needed).
 */
const sendDirectMessage = async (senderId, receiverId, text) => {
  const conversation = await getOrCreateConversation(senderId, receiverId);
  const message = await sendMessage(conversation._id.toString(), senderId, text);
  return { conversation, message };
};

/**
 * Mark messages as read.
 */
const markAsRead = async (conversationId, userId) => {
  await Message.updateMany(
    { conversation: conversationId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  sendDirectMessage,
  markAsRead,
};
