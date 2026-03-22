const { Router } = require('express');
const { getAll, getUnreadCount, markAsRead, markAllAsRead, remove, clearAll } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = Router();
router.use(protect);

router.get('/', getAll);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', remove);
router.delete('/', clearAll);

module.exports = router;
