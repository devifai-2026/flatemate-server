/**
 * One-off: reset admin password to Admin@123
 * Run: NODE_ENV=production node scripts/_resetAdminPwd.js
 */
const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });
const mongoose = require('mongoose');
const User = require('../models/User');

const NEW_PASSWORD = 'Admin@123';

(async () => {
  console.log(`Environment: ${env}`);
  await mongoose.connect(process.env.MONGO_URI);

  const admins = await User.find({ isAdmin: true }).select('+password email name phone');
  if (admins.length === 0) {
    console.log('No admin users found.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${admins.length} admin user(s):`);
  for (const admin of admins) {
    console.log(`  - ${admin.email || '(no email)'} | ${admin.name || ''} | ${admin.phone}`);
    admin.password = NEW_PASSWORD; // pre('save') hook hashes it
    await admin.save();
    console.log(`    ✓ password reset to "${NEW_PASSWORD}"`);
  }

  await mongoose.disconnect();
  console.log('Done.');
})().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
