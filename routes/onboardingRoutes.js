const { Router } = require('express');
const { step1, step2, updateLocation } = require('../controllers/onboardingController');
const { protect } = require('../middleware/auth');

const router = Router();
router.use(protect);

router.put('/step1', step1);
router.put('/step2', step2);
router.put('/location', updateLocation);

module.exports = router;
