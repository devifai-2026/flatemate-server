const { Router } = require('express');
const { toggle, getMyWishlist, getSavedIds } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = Router();

router.use(protect);
router.post('/toggle', toggle);
router.get('/', getMyWishlist);
router.get('/ids', getSavedIds);

module.exports = router;
