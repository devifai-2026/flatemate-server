const asyncHandler = require('../utils/asyncHandler');
const roommateService = require('../services/roommateService');

/** POST /api/roommates */
const createListing = asyncHandler(async (req, res) => {
  const listing = await roommateService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data: listing });
});

/** GET /api/roommates */
const getListings = asyncHandler(async (req, res) => {
  const result = await roommateService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

module.exports = { createListing, getListings };
