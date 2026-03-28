const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    surname: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    nameEdited: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      sparse: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
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
      type: String,
      trim: true,
    },

    // ── User type (onboarding step 1) ──
    userType: {
      type: String,
      enum: ['seeker', 'pg-owner', 'flat-owner'],
      // seeker = looking for flat/flatmate/PG
      // pg-owner = owns a PG
      // flat-owner = owns a flat/room
    },

    // ── City (onboarding step 1) ──
    city: {
      type: String,
      trim: true,
    },

    // ── Lifestyle tags (onboarding step 2) — min 5 required ──
    lifestyleTags: {
      type: [String],
      enum: [
        'night-owl', 'early-bird', 'studious', 'fitness-freak',
        'sporty', 'wanderer', 'party-lover', 'pet-lover',
        'vegan', 'non-alcoholic', 'music-lover', 'non-smoker',
        'foodie', 'gamer', 'workaholic', 'spiritual',
      ],
      default: [],
    },

    // ── Wallet balance (tokens) ──
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Onboarding progress ──
    onboardingComplete: {
      type: Boolean,
      default: false,
    },

    // ── Location coordinates for distance calculation ──
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
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
      verificationId: { type: String, select: false },
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

// Geo index for distance queries
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
