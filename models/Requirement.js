const mongoose = require('mongoose');

/**
 * A Requirement is a "I am looking for..." post.
 * Users post what they need — either a room or a flatmate.
 */
const requirementSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['flatmate'],
      default: 'flatmate',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    budget: {
      min: { type: Number, min: 0, required: true },
      max: { type: Number, min: 0, required: true },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    moveInDate: {
      type: Date,
    },
    // ── About me (poster) ──
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary'],
    },
    age: { type: Number, min: 18, max: 120 },
    occupation: {
      type: String,
      enum: ['student', 'working-professional', 'freelancer', 'business', 'other'],
    },
    religion: {
      type: String,
      enum: ['hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'no-preference', 'other'],
    },
    foodPreference: {
      type: String,
      enum: ['veg', 'non-veg', 'eggetarian', 'vegan', 'no-preference'],
    },
    languages: {
      type: [String],
      default: [],
    },

    // ── Preferred roommate ──
    preferredRoommate: {
      gender: {
        type: String,
        enum: ['male', 'female', 'non-binary', 'any'],
        default: 'any',
      },
      ageMin: { type: Number, min: 18 },
      ageMax: { type: Number, max: 120 },
      occupation: { type: String, trim: true },
      religion: { type: String },
      foodPreference: { type: String },
    },

    // ── Lifestyle ──
    lifestyle: {
      smoking: { type: Boolean, default: false },
      drinking: { type: Boolean, default: false },
      pets: { type: Boolean, default: false },
      sleepSchedule: {
        type: String,
        enum: ['early-bird', 'night-owl', 'flexible'],
        default: 'flexible',
      },
      cleanliness: {
        type: String,
        enum: ['very-clean', 'moderate', 'relaxed'],
        default: 'moderate',
      },
      guests: {
        type: String,
        enum: ['often', 'sometimes', 'rarely', 'never'],
        default: 'sometimes',
      },
    },

    // ── Room preferences ──
    roomType: {
      type: String,
      enum: ['single', 'shared', 'any'],
      default: 'any',
    },
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
    notes: {
      type: String,
      maxlength: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Phone visibility ──
    phoneVisibility: {
      type: String,
      enum: ['masked', 'reveal'],
      default: 'masked',
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

requirementSchema.index({ location: 1, type: 1, 'budget.min': 1 });

module.exports = mongoose.model('Requirement', requirementSchema);
