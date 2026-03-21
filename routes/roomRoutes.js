const { Router } = require('express');
const {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { roomSchema, roomUpdateSchema } = require('../utils/validators');

const router = Router();

router
  .route('/')
  .get(getRooms)
  .post(protect, validate(roomSchema), createRoom);

router
  .route('/:id')
  .get(getRoom)
  .put(protect, validate(roomUpdateSchema), updateRoom)
  .delete(protect, deleteRoom);

module.exports = router;
