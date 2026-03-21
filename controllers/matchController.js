const asyncHandler = require('../utils/asyncHandler');
const matchingService = require('../services/matchingService');

/** GET /api/match/:userId */
const getMatches = asyncHandler(async (req, res) => {
  const matches = await matchingService.getMatches(req.params.userId);
  res.status(200).json({ success: true, data: matches });
});

module.exports = { getMatches };
