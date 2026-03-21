const { Router } = require('express');
const { getMe, updatePreferences } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { preferencesSchema } = require('../utils/validators');

const router = Router();

router.use(protect); // all user routes require auth

router.get('/me', getMe);
router.put('/preferences', validate(preferencesSchema), updatePreferences);

module.exports = router;
