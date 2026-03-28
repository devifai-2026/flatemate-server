const Room = require('../models/Room');
const AppError = require('../utils/AppError');

/**
 * Create a new room listing.
 */
const create = async (data, userId) => {
  return Room.create({ ...data, postedBy: userId });
};

/**
 * Get rooms with filters and pagination.
 */
const getAll = async (query) => {
  const {
    location, minRent, maxRent, amenities, preferredTenant,
    roomType, furnishing, parking, sort,
    page = 1, limit = 10,
  } = query;

  const filter = { isHidden: { $ne: true } };

  if (location) filter.location = new RegExp(location, 'i');
  if (minRent || maxRent) {
    filter.rent = {};
    if (minRent) filter.rent.$gte = Number(minRent);
    if (maxRent) filter.rent.$lte = Number(maxRent);
  }
  if (amenities) {
    const list = amenities.split(',').map((a) => a.trim());
    filter.amenities = { $all: list };
  }
  if (preferredTenant) filter.preferredTenant = preferredTenant;
  if (roomType) filter.roomType = roomType;
  if (furnishing) filter.furnishing = furnishing;
  if (parking) filter.parking = parking;

  const skip = (Number(page) - 1) * Number(limit);

  let sortObj = { createdAt: -1 };
  if (sort === 'rent') sortObj = { rent: 1 };
  else if (sort === '-rent') sortObj = { rent: -1 };

  const [rooms, total] = await Promise.all([
    Room.find(filter)
      .populate('postedBy', 'name email verified profileImage')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit)),
    Room.countDocuments(filter),
  ]);

  return {
    rooms,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Get a single room by ID.
 */
const getById = async (id) => {
  const room = await Room.findById(id).populate('postedBy', 'name email verified profileImage phone city');
  if (!room) throw new AppError('Room not found', 404);
  return room;
};

/**
 * Update a room listing (only the owner can update).
 */
const update = async (id, data, userId) => {
  const room = await Room.findById(id);
  if (!room) throw new AppError('Room not found', 404);
  if (room.postedBy.toString() !== userId) {
    throw new AppError('Not authorized to update this listing', 403);
  }

  Object.assign(room, data);
  await room.save();
  return room;
};

/**
 * Delete a room listing (only the owner can delete).
 */
const remove = async (id, userId) => {
  const room = await Room.findById(id);
  if (!room) throw new AppError('Room not found', 404);
  if (room.postedBy.toString() !== userId) {
    throw new AppError('Not authorized to delete this listing', 403);
  }

  await room.deleteOne();
};

module.exports = { create, getAll, getById, update, remove };
