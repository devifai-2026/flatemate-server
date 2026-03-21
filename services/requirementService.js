const Requirement = require('../models/Requirement');
const AppError = require('../utils/AppError');

/**
 * Create a new requirement ("I am looking for...").
 */
const create = async (data, userId) => {
  return Requirement.create({ ...data, createdBy: userId });
};

/**
 * Get all requirements with filters and pagination.
 */
const getAll = async (query) => {
  const {
    type,
    location,
    minBudget,
    maxBudget,
    gender,
    smoking,
    drinking,
    pets,
    sleepSchedule,
    page = 1,
    limit = 10,
  } = query;

  const filter = { isActive: true };

  if (type) filter.type = type;
  if (location) filter.location = new RegExp(location, 'i');
  if (minBudget) filter['budget.max'] = { $gte: Number(minBudget) };
  if (maxBudget) filter['budget.min'] = { $lte: Number(maxBudget) };
  if (gender) filter['preferredRoommate.gender'] = gender;
  if (smoking !== undefined) filter['lifestyle.smoking'] = smoking === 'true';
  if (drinking !== undefined) filter['lifestyle.drinking'] = drinking === 'true';
  if (pets !== undefined) filter['lifestyle.pets'] = pets === 'true';
  if (sleepSchedule) filter['lifestyle.sleepSchedule'] = sleepSchedule;

  const skip = (Number(page) - 1) * Number(limit);

  const [requirements, total] = await Promise.all([
    Requirement.find(filter)
      .populate('createdBy', 'name email age gender occupation bio profileImage verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Requirement.countDocuments(filter),
  ]);

  return {
    requirements,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Get a single requirement by ID.
 */
const getById = async (id) => {
  const requirement = await Requirement.findById(id)
    .populate('createdBy', 'name email age gender occupation bio profileImage verified');
  if (!requirement) throw new AppError('Requirement not found', 404);
  return requirement;
};

/**
 * Update a requirement (only the creator can update).
 */
const update = async (id, data, userId) => {
  const requirement = await Requirement.findById(id);
  if (!requirement) throw new AppError('Requirement not found', 404);
  if (requirement.createdBy.toString() !== userId) {
    throw new AppError('Not authorized to update this requirement', 403);
  }

  Object.assign(requirement, data);
  await requirement.save();
  return requirement;
};

/**
 * Delete a requirement (only the creator can delete).
 */
const remove = async (id, userId) => {
  const requirement = await Requirement.findById(id);
  if (!requirement) throw new AppError('Requirement not found', 404);
  if (requirement.createdBy.toString() !== userId) {
    throw new AppError('Not authorized to delete this requirement', 403);
  }

  await requirement.deleteOne();
};

module.exports = { create, getAll, getById, update, remove };
