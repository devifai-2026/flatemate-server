/**
 * One-off: create (or reset) the restricted "lister" admin login.
 *
 * The lister can sign into the admin panel but only sees 3 tabs:
 * Add Listing, Listings, and Users.
 *
 * Run: NODE_ENV=production node scripts/_createLister.js
 *  (defaults to development if NODE_ENV is unset)
 */
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });
const mongoose = require('mongoose');
const User = require('../models/User');

const EMAIL = 'lister@justflatmate.in';
const PASSWORD = 'Lister@123';
const NAME = 'Listing Operator';

(async () => {
  console.log(`Environment: ${env}`);
  await mongoose.connect(process.env.MONGO_URI);

  let user = await User.findOne({ email: EMAIL }).select('+password');

  if (user) {
    user.password = PASSWORD; // pre('save') hook hashes it
    user.isAdmin = true;
    user.role = 'lister';
    user.verified = true;
    user.phoneVerified = true;
    if (!user.name) user.name = NAME;
    await user.save();
    console.log(`✓ Updated existing lister account (${EMAIL}) — password reset to "${PASSWORD}"`);
  } else {
    user = await User.create({
      email: EMAIL,
      password: PASSWORD,
      name: NAME,
      phone: `lister_${Date.now()}`,
      isAdmin: true,
      role: 'lister',
      verified: true,
      phoneVerified: true,
    });
    console.log(`✓ Created lister account`);
  }

  console.log('');
  console.log('  Login credentials');
  console.log('  ─────────────────');
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Role:     lister (Add Listing / Listings / Users only)`);

  await mongoose.disconnect();
  console.log('\nDone.');
})().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
