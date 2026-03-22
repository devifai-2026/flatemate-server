const { Router } = require('express');
const {
  getConversations, getMessages, sendMessage, markAsRead,
  deleteMessage, blockUser, unblockUser,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = Router();
router.use(protect);

router.get('/conversations', getConversations);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);
router.put('/:conversationId/read', markAsRead);
router.delete('/messages/:messageId', deleteMessage);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);

module.exports = router;
