const { Router } = require('express');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const Room = require('../models/Room');
const PG = require('../models/PG');
const Requirement = require('../models/Requirement');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const UnlockedListing = require('../models/UnlockedListing');
const Notification = require('../models/Notification');
const Team = require('../models/Team');

const router = Router();
router.use(protect);

/** GET /api/dashboard — user's dashboard stats + recent activity */
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // First get user's conversation IDs
  const userConvos = await Conversation.find({ participants: userId }).select('_id').lean();
  const convoIds = userConvos.map((c) => c._id);

  const [
    myRooms, myPGs, myRequirements,
    totalUnlocks,
    unreadMessages,
    unreadNotifs,
    myTeams,
    recentConversations,
  ] = await Promise.all([
    Room.countDocuments({ postedBy: userId }),
    PG.countDocuments({ postedBy: userId }),
    Requirement.countDocuments({ createdBy: userId }),
    UnlockedListing.countDocuments({ listingOwner: userId }),
    convoIds.length > 0
      ? Message.countDocuments({ conversation: { $in: convoIds }, readBy: { $ne: userId }, deletedFor: { $ne: userId }, sender: { $ne: userId } })
      : 0,
    Notification.countDocuments({ user: userId, read: false }),
    Team.countDocuments({ members: userId }),
    Conversation.find({ participants: userId })
      .populate('participants', 'name profileImage phone')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  // Get unlock counts per listing type for the user's listings
  const unlocksByType = await UnlockedListing.aggregate([
    { $match: { listingOwner: require('mongoose').Types.ObjectId.createFromHexString(userId) } },
    { $group: { _id: '$listingType', count: { $sum: 1 } } },
  ]);
  const unlockMap = {};
  unlocksByType.forEach((u) => { unlockMap[u._id] = u.count; });

  // Recent rooms (latest 4 from platform for discovery)
  const recentRooms = await Room.find()
    .populate('postedBy', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  res.json({
    success: true,
    data: {
      stats: {
        myRooms,
        myPGs,
        myRequirements,
        totalListings: myRooms + myPGs + myRequirements,
        totalUnlocks,
        roomUnlocks: unlockMap.room || 0,
        pgUnlocks: unlockMap.pg || 0,
        requirementUnlocks: unlockMap.requirement || 0,
        unreadMessages,
        unreadNotifs,
        myTeams,
      },
      recentConversations,
      recentRooms,
    },
  });
}));

module.exports = router;
