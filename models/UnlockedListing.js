const mongoose = require('mongoose');

const unlockedListingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listingType: {
      type: String,
      enum: ['room', 'pg', 'requirement'],
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    listingOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// One unlock per user per listing
unlockedListingSchema.index({ user: 1, listingType: 1, listingId: 1 }, { unique: true });

module.exports = mongoose.model('UnlockedListing', unlockedListingSchema);
