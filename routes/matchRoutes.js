const { Router } = require('express');
const { getMatches } = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

const router = Router();

router.get('/:userId', protect, getMatches);

module.exports = router;
