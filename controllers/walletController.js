const asyncHandler = require('../utils/asyncHandler');
const walletService = require('../services/walletService');

const getBalance = asyncHandler(async (req, res) => {
  const result = await walletService.getBalance(req.user.id);
  res.status(200).json({ success: true, data: result });
});

const createRechargeOrder = asyncHandler(async (req, res) => {
  const result = await walletService.createRechargeOrder(req.user.id);
  res.status(201).json({ success: true, data: result });
});

const verifyRecharge = asyncHandler(async (req, res) => {
  const result = await walletService.verifyRecharge(req.user.id, req.body);
  res.status(200).json({ success: true, data: result });
});

const unlockListing = asyncHandler(async (req, res) => {
  const { listingType, listingId } = req.body;
  const result = await walletService.unlockListing(req.user.id, listingType, listingId);
  res.status(200).json({ success: true, data: result });
});

const checkAccess = asyncHandler(async (req, res) => {
  const { listingType, listingId } = req.params;
  const result = await walletService.checkAccess(req.user.id, listingType, listingId);
  res.status(200).json({ success: true, data: result });
});

const getUnlockedIds = asyncHandler(async (req, res) => {
  const result = await walletService.getUnlockedIds(req.user.id);
  res.status(200).json({ success: true, data: result });
});

const getTransactions = asyncHandler(async (req, res) => {
  const result = await walletService.getTransactions(req.user.id, req.query);
  res.status(200).json({ success: true, data: result });
});

module.exports = { getBalance, createRechargeOrder, verifyRecharge, unlockListing, checkAccess, getUnlockedIds, getTransactions };
