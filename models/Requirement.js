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
      enum: ['room', 'flatmate'],
      required: [true, 'Requirement type is required'],
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
    preferredRoommate: {
      gender: {
        type: String,
        enum: ['male', 'female', 'non-binary', 'any'],
        default: 'any',
      },
      ageMin: { type: Number, min: 18 },
      ageMax: { type: Number, max: 120 },
      occupation: { type: String, trim: true },
    },
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
