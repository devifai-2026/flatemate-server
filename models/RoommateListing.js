const mongoose = require('mongoose');

const roommateListingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    preferredLocation: {
      type: String,
      required: [true, 'Preferred location is required'],
      trim: true,
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
    moveInDate: {
      type: Date,
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
  },
  { timestamps: true }
);

roommateListingSchema.index({ preferredLocation: 1 });

module.exports = mongoose.model('RoommateListing', roommateListingSchema);
