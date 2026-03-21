const { Router } = require('express');
const {
  createRequirement,
  getRequirements,
  getRequirement,
  updateRequirement,
  deleteRequirement,
} = require('../controllers/requirementController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { requirementSchema, requirementUpdateSchema } = require('../utils/validators');

const router = Router();

router
  .route('/')
  .get(getRequirements)
  .post(protect, validate(requirementSchema), createRequirement);

router
  .route('/:id')
  .get(getRequirement)
  .put(protect, validate(requirementUpdateSchema), updateRequirement)
  .delete(protect, deleteRequirement);

module.exports = router;
