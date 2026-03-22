const { Router } = require('express');
const { getMe, updatePreferences, getUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { preferencesSchema } = require('../utils/validators');

const router = Router();

router.get('/me', protect, getMe);
router.put('/preferences', protect, validate(preferencesSchema), updatePreferences);
router.get('/:id', protect, getUser);

module.exports = router;
