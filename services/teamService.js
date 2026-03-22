const Team = require('../models/Team');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const notificationService = require('./notificationService');
const AppError = require('../utils/AppError');

const MEMBER_FIELDS = 'name phone profileImage city verified';

/**
 * Create a private team. Creator is first member.
 * Also creates a group conversation for the team.
 */
const create = async (data, userId) => {
  const now = new Date();

  const team = await Team.create({
    ...data,
    createdBy: userId,
    members: [userId],
  });

  // Create group conversation
  const conversation = await Conversation.create({
    participants: [userId],
    isGroup: true,
    groupName: data.name,
    team: team._id,
    memberJoinedAt: new Map([[userId.toString(), now]]),
  });

  // Link conversation to team
  team.conversation = conversation._id;
  await team.save();

  // System message: team created
  const creator = await User.findById(userId).select('name').lean();
  await Message.create({
    conversation: conversation._id,
    sender: userId,
    text: `${creator?.name || 'Someone'} created the team`,
    messageType: 'system',
  });

  await team.populate('members', MEMBER_FIELDS);
  return team;
};

/**
 * Join a team via passkey.
 * Adds user to group conversation + system message + notifications.
 */
const joinByPasskey = async (passkey, userId) => {
  const team = await Team.findOne({ passkey: passkey.toUpperCase().trim() });
  if (!team) throw new AppError('Invalid passkey. Check and try again.', 404);

  const alreadyMember = team.members.some((m) => m.toString() === userId);
  if (alreadyMember) throw new AppError('You are already in this team', 400);

  if (team.members.length >= team.maxMembers) {
    throw new AppError('Team is full', 400);
  }

  const now = new Date();
  const joiner = await User.findById(userId).select('name').lean();
  const joinerName = joiner?.name || 'Someone';

  // Add to team
  team.members.push(userId);
  await team.save();

  // Add to group conversation
  let conversation = await Conversation.findById(team.conversation);
  if (!conversation) {
    // Fallback: create conversation if it doesn't exist (for older teams)
    conversation = await Conversation.create({
      participants: team.members,
      isGroup: true,
      groupName: team.name,
      team: team._id,
      memberJoinedAt: new Map(team.members.map((m) => [m.toString(), now])),
    });
    team.conversation = conversation._id;
    await team.save();
  } else {
    conversation.participants.push(userId);
    conversation.memberJoinedAt.set(userId.toString(), now);
    await conversation.save();
  }

  // System message: user joined
  const sysMsg = await Message.create({
    conversation: conversation._id,
    sender: userId,
    text: `${joinerName} joined the team`,
    messageType: 'system',
  });

  // Update lastMessage
  conversation.lastMessage = { text: `${joinerName} joined the team`, sender: userId, sentAt: sysMsg.createdAt };
  await conversation.save();

  // Notify existing members
  const existingMembers = team.members.filter((m) => m.toString() !== userId);
  for (const memberId of existingMembers) {
    await notificationService.create({
      user: memberId,
      type: 'team_join',
      title: `${joinerName} joined "${team.name}"`,
      body: `${joinerName} joined your team`,
      link: { type: 'team', id: team._id },
      fromUser: userId,
    });
  }

  await team.populate('members', MEMBER_FIELDS);
  return team;
};

/**
 * Get all teams the user is a member of.
 */
const getMyTeams = async (userId) => {
  const teams = await Team.find({ members: userId })
    .populate('members', MEMBER_FIELDS)
    .populate('createdBy', 'name phone')
    .sort({ updatedAt: -1 });
  return teams;
};

/**
 * Get a single team (must be a member).
 */
const getById = async (teamId, userId) => {
  const team = await Team.findById(teamId)
    .populate('members', MEMBER_FIELDS)
    .populate('createdBy', 'name phone profileImage')
    .populate('sharedWishlist.addedBy', 'name profileImage');

  if (!team) throw new AppError('Team not found', 404);

  const isMember = team.members.some((m) => m._id.toString() === userId.toString());
  if (!isMember) throw new AppError('You are not a member of this team', 403);

  return team;
};

/**
 * Add item to team's shared wishlist.
 */
const addToSharedWishlist = async (teamId, userId, itemType, itemId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);

  const isMember = team.members.some((m) => m.toString() === userId);
  if (!isMember) throw new AppError('You are not a member of this team', 403);

  const alreadySaved = team.sharedWishlist.some(
    (w) => w.itemType === itemType && w.itemId.toString() === itemId
  );
  if (alreadySaved) throw new AppError('Already in team wishlist', 400);

  team.sharedWishlist.push({ itemType, itemId, addedBy: userId });
  await team.save();
  return { message: 'Added to team wishlist' };
};

/**
 * Remove item from team's shared wishlist.
 */
const removeFromSharedWishlist = async (teamId, userId, itemType, itemId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);

  const isMember = team.members.some((m) => m.toString() === userId);
  if (!isMember) throw new AppError('You are not a member of this team', 403);

  team.sharedWishlist = team.sharedWishlist.filter(
    (w) => !(w.itemType === itemType && w.itemId.toString() === itemId)
  );
  await team.save();
  return { message: 'Removed from team wishlist' };
};

/**
 * Get team's shared wishlist with populated items.
 */
const getSharedWishlist = async (teamId, userId) => {
  const team = await Team.findById(teamId).populate('sharedWishlist.addedBy', 'name profileImage');
  if (!team) throw new AppError('Team not found', 404);

  const isMember = team.members.some((m) => m.toString() === userId.toString());
  if (!isMember) throw new AppError('You are not a member of this team', 403);

  // Populate each wishlist item
  const populated = await Promise.all(
    team.sharedWishlist.map(async (item) => {
      let Model, popField;
      switch (item.itemType) {
        case 'room': Model = require('../models/Room'); popField = 'postedBy'; break;
        case 'pg': Model = require('../models/PG'); popField = 'postedBy'; break;
        case 'requirement': Model = require('../models/Requirement'); popField = 'createdBy'; break;
        default: return { ...item.toObject(), data: null };
      }
      const data = await Model.findById(item.itemId)
        .populate(popField, 'name profileImage phone city')
        .lean();
      return { ...item.toObject(), data };
    })
  );

  return populated.filter((i) => i.data !== null);
};

/**
 * Leave a team. Creator cannot leave.
 * Removes from group conversation + system message.
 */
const leave = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);

  if (team.createdBy.toString() === userId) {
    throw new AppError('Creator cannot leave. Delete the team instead.', 400);
  }

  const leaver = await User.findById(userId).select('name').lean();
  const leaverName = leaver?.name || 'Someone';

  team.members = team.members.filter((m) => m.toString() !== userId);
  await team.save();

  // Remove from group conversation + system message
  if (team.conversation) {
    const conversation = await Conversation.findById(team.conversation);
    if (conversation) {
      conversation.participants = conversation.participants.filter((p) => p.toString() !== userId);
      const sysMsg = await Message.create({
        conversation: conversation._id,
        sender: userId,
        text: `${leaverName} left the team`,
        messageType: 'system',
      });
      conversation.lastMessage = { text: `${leaverName} left the team`, sender: userId, sentAt: sysMsg.createdAt };
      await conversation.save();
    }
  }

  return { message: 'Left the team' };
};

/**
 * Delete a team (creator only). Also deletes the group conversation.
 */
const remove = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  if (team.createdBy.toString() !== userId) {
    throw new AppError('Only the creator can delete this team', 403);
  }

  // Clean up conversation and messages
  if (team.conversation) {
    await Message.deleteMany({ conversation: team.conversation });
    await Conversation.findByIdAndDelete(team.conversation);
  }

  await team.deleteOne();
  return { message: 'Team deleted' };
};

module.exports = { create, joinByPasskey, getMyTeams, getById, addToSharedWishlist, removeFromSharedWishlist, getSharedWishlist, leave, remove };
