const { Router } = require('express');
const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendMessageSchema } = require('../utils/validators');

const router = Router();

router.use(protect); // all chat routes require auth

router.get('/conversations', getConversations);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', validate(sendMessageSchema), sendMessage);
router.put('/:conversationId/read', markAsRead);

module.exports = router;
