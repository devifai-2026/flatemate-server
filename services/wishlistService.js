const WishlistItem = require('../models/Wishlist');
const AppError = require('../utils/AppError');

const addItem = async (userId, itemType, itemId) => {
  const existing = await WishlistItem.findOne({ user: userId, itemType, itemId });
  if (existing) throw new AppError('Already saved', 400);

  const item = await WishlistItem.create({ user: userId, itemType, itemId });
  return item;
};

const removeItem = async (userId, itemType, itemId) => {
  const item = await WishlistItem.findOneAndDelete({ user: userId, itemType, itemId });
  if (!item) throw new AppError('Item not in saved list', 404);
  return { message: 'Removed from saved' };
};

const toggleItem = async (userId, itemType, itemId) => {
  const existing = await WishlistItem.findOne({ user: userId, itemType, itemId });
  if (existing) {
    await WishlistItem.findByIdAndDelete(existing._id);
    return { saved: false, message: 'Removed from saved' };
  }
  await WishlistItem.create({ user: userId, itemType, itemId });
  return { saved: true, message: 'Added to saved' };
};

const getMyWishlist = async (userId) => {
  const items = await WishlistItem.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  // Populate each item based on its type
  const populated = await Promise.all(
    items.map(async (item) => {
      let Model, popField;
      switch (item.itemType) {
        case 'room': Model = require('../models/Room'); popField = 'postedBy'; break;
        case 'pg': Model = require('../models/PG'); popField = 'postedBy'; break;
        case 'requirement': Model = require('../models/Requirement'); popField = 'createdBy'; break;
        case 'roommate': Model = require('../models/RoommateListing'); popField = 'postedBy'; break;
        default: return { ...item, data: null };
      }
      const data = await Model.findById(item.itemId).populate(popField, 'name profileImage city phone').lean();
      return { ...item, data };
    })
  );

  return populated.filter((i) => i.data !== null);
};

const checkSaved = async (userId, itemType, itemId) => {
  const exists = await WishlistItem.findOne({ user: userId, itemType, itemId });
  return { saved: !!exists };
};

const getSavedIds = async (userId) => {
  const items = await WishlistItem.find({ user: userId }).select('itemType itemId').lean();
  return items.reduce((acc, item) => {
    const key = `${item.itemType}_${item.itemId}`;
    acc[key] = true;
    return acc;
  }, {});
};

module.exports = { addItem, removeItem, toggleItem, getMyWishlist, checkSaved, getSavedIds };
