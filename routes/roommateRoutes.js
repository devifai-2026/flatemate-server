const { Router } = require('express');
const { createListing, getListings } = require('../controllers/roommateController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { roommateListingSchema } = require('../utils/validators');

const router = Router();

router
  .route('/')
  .get(getListings)
  .post(protect, validate(roommateListingSchema), createListing);

module.exports = router;
