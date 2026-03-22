const { Router } = require('express');
const {
  createTeam, joinTeam, getMyTeams, getTeam,
  addToWishlist, removeFromWishlist, getWishlist,
  leaveTeam, deleteTeam,
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

const router = Router();

// All team routes require auth
router.use(protect);

router.post('/', createTeam);           // Create team → returns passkey
router.post('/join', joinTeam);          // Join via passkey { passkey: "FM-A7X2K9" }
router.get('/', getMyTeams);             // Get my teams only

router.get('/:id', getTeam);
router.delete('/:id', deleteTeam);
router.post('/:id/leave', leaveTeam);

// Shared wishlist
router.get('/:id/wishlist', getWishlist);
router.post('/:id/wishlist', addToWishlist);
router.delete('/:id/wishlist', removeFromWishlist);

module.exports = router;
