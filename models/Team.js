const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: 100,
    },
    // Unique passkey for joining (e.g. FM-A7X2K9)
    passkey: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    budget: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxMembers: {
      type: Number,
      default: 5,
      min: 2,
      max: 10,
    },
    // Shared wishlist — items saved by any team member
    sharedWishlist: [
      {
        itemType: { type: String, enum: ['room', 'pg', 'requirement'] },
        itemId: { type: mongoose.Schema.Types.ObjectId },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Generate passkey before saving (if not set)
teamSchema.pre('validate', function () {
  if (!this.passkey) {
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.passkey = `FM-${rand}`;
  }
});

module.exports = mongoose.model('Team', teamSchema);
