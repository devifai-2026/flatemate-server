const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);

  const User = require('../models/User');
  const WalletTransaction = require('../models/WalletTransaction');
  const BonusConfig = require('../models/BonusConfig');

  const phone = process.argv[2];
  if (!phone) { console.error('Usage: node _creditUser.js <phone>'); process.exit(1); }

  const user = await User.findOne({ phone });
  if (!user) { console.error('User not found'); process.exit(1); }

  const cfg = await BonusConfig.getSingleton();
  const amount = cfg.signupBonus;
  if (!amount || amount <= 0) { console.error('signupBonus is 0'); process.exit(1); }

  // Idempotent — skip if a signup-bonus txn already exists.
  const existing = await WalletTransaction.findOne({
    user: user._id,
    description: { $regex: '^Signup bonus' },
  });
  if (existing) {
    console.log('Already has signup-bonus transaction, skipping:', existing._id);
    process.exit(0);
  }

  user.walletBalance = (user.walletBalance || 0) + amount;
  await user.save();

  await WalletTransaction.create({
    user: user._id,
    type: 'recharge',
    amount: 0,
    tokens: amount,
    description: `Signup bonus (${amount} tokens) — backfilled`,
    paymentStatus: 'paid',
  });

  console.log(`Credited ${amount} tokens to ${user.phone} (${user._id}). New balance: ${user.walletBalance}`);
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
