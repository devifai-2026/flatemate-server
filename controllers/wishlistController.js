const asyncHandler = require('../utils/asyncHandler');
const wishlistService = require('../services/wishlistService');

const toggle = asyncHandler(async (req, res) => {
  const result = await wishlistService.toggleItem(req.user.id, req.body.itemType, req.body.itemId);
  res.status(200).json({ success: true, data: result });
});

const getMyWishlist = asyncHandler(async (req, res) => {
  const items = await wishlistService.getMyWishlist(req.user.id);
  res.status(200).json({ success: true, data: items });
});

const getSavedIds = asyncHandler(async (req, res) => {
  const ids = await wishlistService.getSavedIds(req.user.id);
  res.status(200).json({ success: true, data: ids });
});

module.exports = { toggle, getMyWishlist, getSavedIds };
