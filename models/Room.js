const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2000,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    rent: {
      type: Number,
      required: [true, 'Rent is required'],
      min: 0,
    },
    deposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    availableFrom: {
      type: Date,
      required: [true, 'Available date is required'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    preferredTenant: {
      type: String,
      enum: ['male', 'female', 'any', 'family', 'students', 'working-professionals'],
      default: 'any',
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

roomSchema.index({ location: 1, rent: 1 });

module.exports = mongoose.model('Room', roomSchema);
