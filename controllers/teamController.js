const asyncHandler = require('../utils/asyncHandler');
const teamService = require('../services/teamService');

const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data: team });
});

const joinTeam = asyncHandler(async (req, res) => {
  const team = await teamService.joinByPasskey(req.body.passkey, req.user.id);
  res.status(200).json({ success: true, data: team });
});

const getMyTeams = asyncHandler(async (req, res) => {
  const teams = await teamService.getMyTeams(req.user.id);
  res.status(200).json({ success: true, data: teams });
});

const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getById(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: team });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const result = await teamService.addToSharedWishlist(req.params.id, req.user.id, req.body.itemType, req.body.itemId);
  res.status(200).json({ success: true, data: result });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const result = await teamService.removeFromSharedWishlist(req.params.id, req.user.id, req.body.itemType, req.body.itemId);
  res.status(200).json({ success: true, data: result });
});

const getWishlist = asyncHandler(async (req, res) => {
  const items = await teamService.getSharedWishlist(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: items });
});

const leaveTeam = asyncHandler(async (req, res) => {
  const result = await teamService.leave(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: result });
});

const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Team deleted' });
});

module.exports = { createTeam, joinTeam, getMyTeams, getTeam, addToWishlist, removeFromWishlist, getWishlist, leaveTeam, deleteTeam };
