const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const UnlockedListing = require('../models/UnlockedListing');
const Room = require('../models/Room');
const PG = require('../models/PG');
const Requirement = require('../models/Requirement');
const Conversation = require('../models/Conversation');
const AppError = require('../utils/AppError');

const RAZORPAY_KEY_ID = 'rzp_test_SG44kbdRqtUqN8';
const RAZORPAY_KEY_SECRET = 'YszgCu5szeYBnilryqE6mBGR';

function getRazorpay() {
  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

const RECHARGE_AMOUNT_PAISE = 1900; // ₹19
const RECHARGE_TOKENS = 20;
const UNLOCK_COST = 19; // 19 tokens per listing

/**
 * Get wallet balance.
 */
const getBalance = async (userId) => {
  const user = await User.findById(userId).select('walletBalance').lean();
  if (!user) throw new AppError('User not found', 404);
  return { balance: user.walletBalance || 0 };
};

/**
 * Create Razorpay order for wallet recharge.
 * ₹19 = 20 tokens.
 */
const createRechargeOrder = async (userId) => {
  console.log('[WALLET] Creating Razorpay order. KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'MISSING');
  let order;
  try {
    order = await getRazorpay().orders.create({
      amount: RECHARGE_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `wallet_${userId}_${Date.now()}`,
      notes: { userId, type: 'wallet_recharge' },
    });
    console.log('[WALLET] Razorpay order created:', order.id);
  } catch (err) {
    console.error('[WALLET] Razorpay order FAILED:', err.message, err.statusCode, JSON.stringify(err.error || {}));
    throw new AppError(err.error?.description || 'Payment gateway error. Please try again.', 502);
  }

  // Create pending transaction
  await WalletTransaction.create({
    user: userId,
    type: 'recharge',
    amount: RECHARGE_AMOUNT_PAISE / 100,
    tokens: RECHARGE_TOKENS,
    description: `Wallet recharge — ₹19 for ${RECHARGE_TOKENS} tokens`,
    razorpayOrderId: order.id,
    paymentStatus: 'pending',
  });

  return {
    orderId: order.id,
    amount: RECHARGE_AMOUNT_PAISE,
    currency: 'INR',
    tokens: RECHARGE_TOKENS,
    keyId: RAZORPAY_KEY_ID,
  };
};

/**
 * Verify recharge payment + credit tokens.
 */
const verifyRecharge = async (userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const expectedSig = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSig !== razorpaySignature) {
    throw new AppError('Payment verification failed', 400);
  }

  const txn = await WalletTransaction.findOne({ razorpayOrderId, user: userId });
  if (!txn) throw new AppError('Transaction not found', 404);
  if (txn.paymentStatus === 'paid') throw new AppError('Already verified', 400);

  txn.razorpayPaymentId = razorpayPaymentId;
  txn.razorpaySignature = razorpaySignature;
  txn.paymentStatus = 'paid';
  await txn.save();

  // Credit tokens
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { walletBalance: RECHARGE_TOKENS } },
    { new: true }
  );

  return {
    message: `${RECHARGE_TOKENS} tokens added to your wallet`,
    balance: user.walletBalance,
  };
};

/**
 * Unlock a listing — deduct tokens, enable chat + call.
 */
const unlockListing = async (userId, listingType, listingId) => {
  // Check if already unlocked
  const existing = await UnlockedListing.findOne({ user: userId, listingType, listingId });
  if (existing) throw new AppError('Already unlocked', 400);

  // Get listing + owner
  const { listing, ownerId, phone, phoneVisibility } = await getListingInfo(listingType, listingId);

  // Can't unlock own listing
  if (ownerId.toString() === userId) throw new AppError('This is your own listing', 400);

  // If phone is set to reveal, no need to pay
  if (phoneVisibility === 'reveal') {
    throw new AppError('Phone is already visible — no unlock needed', 400);
  }

  // Check balance
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (user.walletBalance < UNLOCK_COST) {
    throw new AppError(`Insufficient tokens. Need ${UNLOCK_COST}, have ${user.walletBalance}. Recharge your wallet.`, 400);
  }

  // Deduct tokens
  user.walletBalance -= UNLOCK_COST;
  await user.save();

  // Record unlock
  await UnlockedListing.create({ user: userId, listingType, listingId, listingOwner: ownerId });

  // Record transaction
  await WalletTransaction.create({
    user: userId,
    type: 'debit',
    amount: UNLOCK_COST,
    tokens: UNLOCK_COST,
    description: `Unlocked ${listingType}: ${listing.title || 'Listing'}`,
    listingType,
    listingId,
  });

  // Create conversation so they can chat
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, ownerId], $size: 2 },
    isGroup: { $ne: true },
  });
  if (!conversation) {
    conversation = await Conversation.create({ participants: [userId, ownerId] });
  }

  return {
    message: 'Listing unlocked! You can now chat and call.',
    balance: user.walletBalance,
    phone,
    conversationId: conversation._id,
  };
};

/**
 * Check if user has unlocked a specific listing.
 */
const checkAccess = async (userId, listingType, listingId) => {
  // Owner always has access to their own listing
  const { ownerId, phone, phoneVisibility } = await getListingInfo(listingType, listingId);

  if (ownerId.toString() === userId) {
    return { unlocked: true, phone, isOwner: true };
  }

  // If phone is reveal, everyone has access
  if (phoneVisibility === 'reveal') {
    return { unlocked: true, phone, isFree: true };
  }

  // Check unlock record
  const unlock = await UnlockedListing.findOne({ user: userId, listingType, listingId });
  if (unlock) {
    return { unlocked: true, phone };
  }

  // Masked
  const masked = phone ? phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2') : 'XXXXXXXXXX';
  return { unlocked: false, maskedPhone: masked, cost: UNLOCK_COST };
};

/**
 * Get all unlocked listing IDs for a user (for bulk check on frontend).
 */
const getUnlockedIds = async (userId) => {
  const unlocks = await UnlockedListing.find({ user: userId }).select('listingType listingId').lean();
  return unlocks;
};

/**
 * Get transaction history with pagination + date filter.
 */
const getTransactions = async (userId, { page = 1, limit = 15, type, from, to }) => {
  const query = { user: userId };

  // Only show completed recharges and all debits
  query.$or = [
    { type: 'debit' },
    { type: 'recharge', paymentStatus: 'paid' },
  ];

  if (type && type !== 'all') query.type = type;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [transactions, total] = await Promise.all([
    WalletTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    WalletTransaction.countDocuments(query),
  ]);

  return {
    transactions,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  };
};

// ── Helper ──
async function getListingInfo(listingType, listingId) {
  let listing, ownerId, phone, phoneVisibility;

  if (listingType === 'room') {
    listing = await Room.findById(listingId);
    if (!listing) throw new AppError('Room not found', 404);
    ownerId = listing.postedBy;
    phone = listing.contactPhone;
    phoneVisibility = listing.phoneVisibility || 'masked';
  } else if (listingType === 'pg') {
    listing = await PG.findById(listingId);
    if (!listing) throw new AppError('PG not found', 404);
    ownerId = listing.postedBy;
    phone = listing.contactPhone;
    phoneVisibility = listing.phoneVisibility || 'masked';
  } else if (listingType === 'requirement') {
    listing = await Requirement.findById(listingId);
    if (!listing) throw new AppError('Requirement not found', 404);
    ownerId = listing.createdBy;
    phone = listing.contactPhone;
    phoneVisibility = listing.phoneVisibility || 'masked';
  } else {
    throw new AppError('Invalid listing type', 400);
  }

  // Fallback: if no contactPhone, get from user profile
  if (!phone) {
    const owner = await User.findById(ownerId).select('phone').lean();
    phone = owner?.phone;
  }

  return { listing, ownerId, phone, phoneVisibility };
}

module.exports = {
  getBalance,
  createRechargeOrder,
  verifyRecharge,
  unlockListing,
  checkAccess,
  getUnlockedIds,
  getTransactions,
};
