const asyncHandler = require('../utils/asyncHandler');
const pgService = require('../services/pgService');

const createPG = asyncHandler(async (req, res) => {
  const pg = await pgService.create(req.body, req.user.id);
  const io = req.app.get('io');
  if (io) io.to('admin-room').emit('new-pending-listing', { type: 'pg', listing: pg });
  res.status(201).json({ success: true, data: pg });
});

const getPGs = asyncHandler(async (req, res) => {
  const result = await pgService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

const getPG = asyncHandler(async (req, res) => {
  const pg = await pgService.getById(req.params.id);
  res.status(200).json({ success: true, data: pg });
});

const updatePG = asyncHandler(async (req, res) => {
  const pg = await pgService.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, data: pg });
});

const deletePG = asyncHandler(async (req, res) => {
  await pgService.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'PG deleted' });
});

module.exports = { createPG, getPGs, getPG, updatePG, deletePG };
