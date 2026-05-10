const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

(async () => {
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGO_URI);

  const BonusConfig = require('../models/BonusConfig');
  const User = require('../models/User');
  const WalletTransaction = require('../models/WalletTransaction');

  const cfg = await BonusConfig.findOne({ key: 'default' });
  console.log('BonusConfig:', cfg ? cfg.toObject() : '(none — never created)');

  const recent = await User.find().sort({ createdAt: -1 }).limit(3).select('phone name walletBalance phoneVerified verified createdAt').lean();
  console.log('Recent users:');
  console.log(recent);

  if (recent[0]) {
    const txns = await WalletTransaction.find({ user: recent[0]._id }).sort({ createdAt: -1 }).limit(5).lean();
    console.log(`Last 5 txns for user ${recent[0].phone}:`, txns);
  }

  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
