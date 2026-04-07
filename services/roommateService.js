const RoommateListing = require('../models/RoommateListing');

/**
 * Create a "looking for roommate" listing.
 */
const create = async (data, userId) => {
  return RoommateListing.create({ ...data, user: userId });
};

/**
 * Browse roommate listings with optional filters and pagination.
 */
const getAll = async (query) => {
  const {
    location,
    minBudget,
    maxBudget,
    smoking,
    drinking,
    pets,
    sleepSchedule,
    page = 1,
    limit = 10,
  } = query;

  const filter = { status: 'approved' };

  if (location) filter.preferredLocation = new RegExp(location, 'i');
  if (minBudget) filter['budget.max'] = { $gte: Number(minBudget) };
  if (maxBudget) filter['budget.min'] = { $lte: Number(maxBudget) };
  if (smoking !== undefined) filter['lifestyle.smoking'] = smoking === 'true';
  if (drinking !== undefined) filter['lifestyle.drinking'] = drinking === 'true';
  if (pets !== undefined) filter['lifestyle.pets'] = pets === 'true';
  if (sleepSchedule) filter['lifestyle.sleepSchedule'] = sleepSchedule;

  const skip = (Number(page) - 1) * Number(limit);

  const [listings, total] = await Promise.all([
    RoommateListing.find(filter)
      .populate('user', 'name email age gender occupation verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    RoommateListing.countDocuments(filter),
  ]);

  return {
    listings,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

module.exports = { create, getAll };
