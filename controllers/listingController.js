const asyncHandler = require('../utils/asyncHandler');
const listingService = require('../services/listingService');

/** GET /api/listings/mine */
const getMyListings = asyncHandler(async (req, res) => {
  const data = await listingService.getMyListings(req.user.id);
  res.status(200).json({ success: true, data });
});

/** DELETE /api/listings/:type/:id */
const deleteListing = asyncHandler(async (req, res) => {
  const data = await listingService.deleteListing(req.user.id, req.params.type, req.params.id);
  res.status(200).json({ success: true, data });
});

module.exports = { getMyListings, deleteListing };
