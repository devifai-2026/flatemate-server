const { Router } = require('express');
const { getMyListings, deleteListing } = require('../controllers/listingController');
const { protect } = require('../middleware/auth');

const router = Router();

router.get('/mine', protect, getMyListings);
router.delete('/:type/:id', protect, deleteListing);

module.exports = router;
