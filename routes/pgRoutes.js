const { Router } = require('express');
const { createPG, getPGs, getPG, updatePG, deletePG } = require('../controllers/pgController');
const { protect } = require('../middleware/auth');

const router = Router();

router.route('/').get(getPGs).post(protect, createPG);
router.route('/:id').get(getPG).put(protect, updatePG).delete(protect, deletePG);

module.exports = router;
