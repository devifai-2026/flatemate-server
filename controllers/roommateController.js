const asyncHandler = require('../utils/asyncHandler');
const roommateService = require('../services/roommateService');

/** POST /api/roommates */
const createListing = asyncHandler(async (req, res) => {
  const listing = await roommateService.create(req.body, req.user.id);
  const io = req.app.get('io');
  if (io) io.to('admin-room').emit('new-pending-listing', { type: 'roommate', listing });
  res.status(201).json({ success: true, data: listing });
});

/** GET /api/roommates */
const getListings = asyncHandler(async (req, res) => {
  const result = await roommateService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

module.exports = { createListing, getListings };
