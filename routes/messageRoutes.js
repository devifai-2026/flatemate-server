const { Router } = require('express');
const { sendDirectMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { directMessageSchema } = require('../utils/validators');

const router = Router();

router.use(protect);

// POST /api/messages — send a direct message to any user
router.post('/', validate(directMessageSchema), sendDirectMessage);

module.exports = router;
