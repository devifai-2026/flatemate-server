const Room = require('../models/Room');
const PG = require('../models/PG');
const Requirement = require('../models/Requirement');
const UnlockedListing = require('../models/UnlockedListing');
const AppError = require('../utils/AppError');

/**
 * Get all listings posted by a user (rooms + PGs + requirements)
 * with unlock counts (how many users unlocked/viewed contact info).
 */
const getMyListings = async (userId) => {
  const [rooms, pgs, requirements] = await Promise.all([
    Room.find({ postedBy: userId }).sort({ createdAt: -1 }).lean(),
    PG.find({ postedBy: userId }).sort({ createdAt: -1 }).lean(),
    Requirement.find({ createdBy: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  // Get unlock counts for all listings in one query
  const allIds = [
    ...rooms.map((r) => ({ id: r._id, type: 'room' })),
    ...pgs.map((p) => ({ id: p._id, type: 'pg' })),
    ...requirements.map((r) => ({ id: r._id, type: 'requirement' })),
  ];

  const unlockCounts = await UnlockedListing.aggregate([
    {
      $match: {
        $or: allIds.map((item) => ({
          listingId: item.id,
          listingType: item.type,
        })),
      },
    },
    { $group: { _id: { listingId: '$listingId', listingType: '$listingType' }, count: { $sum: 1 } } },
  ]);

  const countMap = {};
  unlockCounts.forEach((u) => {
    countMap[`${u._id.listingType}:${u._id.listingId}`] = u.count;
  });

  const addCount = (item, type) => ({
    ...item,
    listingType: type,
    unlockCount: countMap[`${type}:${item._id}`] || 0,
  });

  return {
    rooms: rooms.map((r) => addCount(r, 'room')),
    pgs: pgs.map((p) => addCount(p, 'pg')),
    requirements: requirements.map((r) => addCount(r, 'requirement')),
  };
};

/**
 * Delete a listing by type and id (owner only).
 */
const deleteListing = async (userId, listingType, listingId) => {
  let Model, ownerField;
  switch (listingType) {
    case 'room':
      Model = Room;
      ownerField = 'postedBy';
      break;
    case 'pg':
      Model = PG;
      ownerField = 'postedBy';
      break;
    case 'requirement':
      Model = Requirement;
      ownerField = 'createdBy';
      break;
    default:
      throw new AppError('Invalid listing type', 400);
  }

  const listing = await Model.findById(listingId);
  if (!listing) throw new AppError('Listing not found', 404);
  if (listing[ownerField].toString() !== userId.toString()) {
    throw new AppError('You can only delete your own listings', 403);
  }

  await Model.findByIdAndDelete(listingId);
  // Clean up related unlock records
  await UnlockedListing.deleteMany({ listingId, listingType });

  return { message: 'Listing deleted successfully' };
};

module.exports = { getMyListings, deleteListing };
