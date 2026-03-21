const asyncHandler = require('../utils/asyncHandler');
const teamService = require('../services/teamService');

/** POST /api/teams */
const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data: team });
});

/** GET /api/teams */
const getTeams = asyncHandler(async (req, res) => {
  const result = await teamService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

/** GET /api/teams/:id */
const getTeam = asyncHandler(async (req, res) => {
  const team = await teamService.getById(req.params.id);
  res.status(200).json({ success: true, data: team });
});

/** POST /api/teams/:id/join */
const joinTeam = asyncHandler(async (req, res) => {
  const team = await teamService.join(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: team });
});

/** POST /api/teams/:id/leave */
const leaveTeam = asyncHandler(async (req, res) => {
  const team = await teamService.leave(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: team });
});

/** DELETE /api/teams/:id */
const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Team deleted' });
});

module.exports = { createTeam, getTeams, getTeam, joinTeam, leaveTeam, deleteTeam };
