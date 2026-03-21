const { Router } = require('express');
const {
  createTeam,
  getTeams,
  getTeam,
  joinTeam,
  leaveTeam,
  deleteTeam,
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { teamSchema } = require('../utils/validators');

const router = Router();

router
  .route('/')
  .get(getTeams)
  .post(protect, validate(teamSchema), createTeam);

router
  .route('/:id')
  .get(getTeam)
  .delete(protect, deleteTeam);

router.post('/:id/join', protect, joinTeam);
router.post('/:id/leave', protect, leaveTeam);

module.exports = router;
