const Team = require('../models/Team');
const AppError = require('../utils/AppError');

/**
 * Create a new team. Creator is automatically the first member.
 */
const create = async (data, userId) => {
  const team = await Team.create({
    ...data,
    createdBy: userId,
    members: [userId],
  });
  return team.populate('members', 'name email profileImage');
};

/**
 * Get teams with filters and pagination.
 */
const getAll = async (query) => {
  const { location, isOpen, page = 1, limit = 10 } = query;

  const filter = {};
  if (location) filter.location = new RegExp(location, 'i');
  if (isOpen !== undefined) filter.isOpen = isOpen === 'true';

  const skip = (Number(page) - 1) * Number(limit);

  const [teams, total] = await Promise.all([
    Team.find(filter)
      .populate('members', 'name email profileImage verified')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Team.countDocuments(filter),
  ]);

  return {
    teams,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Get a single team by ID.
 */
const getById = async (id) => {
  const team = await Team.findById(id)
    .populate('members', 'name email age gender occupation profileImage verified')
    .populate('createdBy', 'name email');
  if (!team) throw new AppError('Team not found', 404);
  return team;
};

/**
 * Join a team. Fails if team is full or closed.
 */
const join = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  if (!team.isOpen) throw new AppError('This team is no longer accepting members', 400);

  const alreadyMember = team.members.some((m) => m.toString() === userId);
  if (alreadyMember) throw new AppError('You are already a member of this team', 400);

  if (team.members.length >= team.maxMembers) {
    throw new AppError('Team is full', 400);
  }

  team.members.push(userId);
  // Auto-close if full
  if (team.members.length >= team.maxMembers) {
    team.isOpen = false;
  }
  await team.save();

  return team.populate('members', 'name email profileImage verified');
};

/**
 * Leave a team. Creator cannot leave (must delete instead).
 */
const leave = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);

  if (team.createdBy.toString() === userId) {
    throw new AppError('Team creator cannot leave. Delete the team instead', 400);
  }

  const memberIndex = team.members.findIndex((m) => m.toString() === userId);
  if (memberIndex === -1) throw new AppError('You are not a member of this team', 400);

  team.members.splice(memberIndex, 1);
  // Reopen if was closed due to being full
  if (team.members.length < team.maxMembers) {
    team.isOpen = true;
  }
  await team.save();

  return team.populate('members', 'name email profileImage verified');
};

/**
 * Delete a team (only the creator can delete).
 */
const remove = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new AppError('Team not found', 404);
  if (team.createdBy.toString() !== userId) {
    throw new AppError('Only the team creator can delete this team', 403);
  }
  await team.deleteOne();
};

module.exports = { create, getAll, getById, join, leave, remove };
