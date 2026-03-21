const { Router } = require('express');
const {
  createOrder,
  verifyPayment,
  getMyEnquiries,
  checkAccess,
} = require('../controllers/enquiryController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createEnquiryOrderSchema, verifyPaymentSchema } = require('../utils/validators');

const router = Router();

router.use(protect); // all enquiry routes require auth

router.post('/order', validate(createEnquiryOrderSchema), createOrder);
router.post('/verify', validate(verifyPaymentSchema), verifyPayment);
router.get('/mine', getMyEnquiries);
router.get('/access/:listingId', checkAccess);

module.exports = router;
