const asyncHandler = require('../utils/asyncHandler');
const roomService = require('../services/roomService');

/** POST /api/rooms */
const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.create(req.body, req.user.id);
  res.status(201).json({ success: true, data: room });
});

/** GET /api/rooms */
const getRooms = asyncHandler(async (req, res) => {
  const result = await roomService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

/** GET /api/rooms/:id */
const getRoom = asyncHandler(async (req, res) => {
  const room = await roomService.getById(req.params.id);
  res.status(200).json({ success: true, data: room });
});

/** PUT /api/rooms/:id */
const updateRoom = asyncHandler(async (req, res) => {
  const room = await roomService.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, data: room });
});

/** DELETE /api/rooms/:id */
const deleteRoom = asyncHandler(async (req, res) => {
  await roomService.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Room deleted' });
});

module.exports = { createRoom, getRooms, getRoom, updateRoom, deleteRoom };
