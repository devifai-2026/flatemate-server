const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{6,14}$/, 'Please provide a valid phone number'],
    },
    age: {
      type: Number,
      min: 18,
      max: 120,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'other'],
    },
    occupation: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    profileImage: {
      type: String, // URL
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },

    // ── OTP fields ──
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      verificationId: { type: String, select: false }, // MessageCentral verification ID
    },

    // ── Password reset fields ──
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    // ── Preferences ──
    preferences: {
      budgetMin: { type: Number, min: 0 },
      budgetMax: { type: Number, min: 0 },
      preferredLocation: { type: String, trim: true },
      lifestyle: {
        smoking: { type: Boolean, default: false },
        drinking: { type: Boolean, default: false },
        pets: { type: Boolean, default: false },
        sleepSchedule: {
          type: String,
          enum: ['early-bird', 'night-owl', 'flexible'],
          default: 'flexible',
        },
      },
      interests: [{ type: String, trim: true }],
      roommatePreferences: {
        ageMin: { type: Number, min: 18 },
        ageMax: { type: Number, max: 120 },
        gender: {
          type: String,
          enum: ['male', 'female', 'non-binary', 'any'],
        },
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
