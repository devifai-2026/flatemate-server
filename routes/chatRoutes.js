const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const {
  getConversations, getMessages, sendMessage, markAsRead,
  deleteMessage, blockUser, unblockUser,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = Router();
router.use(protect);

// ── File upload config ──
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|mp3|ogg|wav|m4a)$/i;
    if (allowed.test(path.extname(file.originalname)) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  },
});

// Upload endpoint — returns URL
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, data: { url, filename: req.file.filename } });
});

router.get('/conversations', getConversations);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);
router.put('/:conversationId/read', markAsRead);
router.delete('/messages/:messageId', deleteMessage);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);

module.exports = router;
