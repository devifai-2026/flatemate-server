const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

/** GET /api/users/me */
const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: user });
});

/** PUT /api/users/preferences */
const updatePreferences = asyncHandler(async (req, res) => {
  const user = await userService.updatePreferences(req.user.id, req.body);
  res.status(200).json({ success: true, data: user });
});

/** GET /api/users/:id — public profile */
const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.params.id);
  res.status(200).json({ success: true, data: user });
});

module.exports = { getMe, updatePreferences, getUser };
