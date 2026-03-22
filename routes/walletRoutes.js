const { Router } = require('express');
const {
  getBalance, createRechargeOrder, verifyRecharge,
  unlockListing, checkAccess, getUnlockedIds, getTransactions,
} = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = Router();
router.use(protect);

router.get('/balance', getBalance);
router.post('/recharge', createRechargeOrder);
router.post('/recharge/verify', verifyRecharge);
router.post('/unlock', unlockListing);
router.get('/access/:listingType/:listingId', checkAccess);
router.get('/unlocked', getUnlockedIds);
router.get('/transactions', getTransactions);

module.exports = router;
