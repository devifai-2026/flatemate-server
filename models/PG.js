const mongoose = require('mongoose');

const pgSchema = new mongoose.Schema(
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
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
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
    sharing: {
      type: String,
      enum: ['single', 'double', 'triple', 'any'],
      default: 'any',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unisex'],
      default: 'unisex',
    },
    amenities: {
      type: [String],
      default: [],
    },
    meals: {
      type: Boolean,
      default: false,
    },
    mealType: {
      type: String,
      enum: ['veg', 'non-veg', 'both'],
    },
    images: {
      type: [String],
      default: [],
    },
    availableFrom: {
      type: Date,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isHidden: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, trim: true },
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

pgSchema.index({ coordinates: '2dsphere' });
pgSchema.index({ city: 1, rent: 1 });

module.exports = mongoose.model('PG', pgSchema);
