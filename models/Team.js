const mongoose = require('mongoose');

/**
 * A Team allows users to group up and look for a room together.
 * E.g. 3 friends looking for a 3BHK.
 */
const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: 100,
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
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    maxMembers: {
      type: Number,
      default: 4,
      min: 2,
      max: 10,
    },
    isOpen: {
      type: Boolean,
      default: true, // accepting new members
    },
  },
  { timestamps: true }
);

teamSchema.index({ location: 1, isOpen: 1 });

module.exports = mongoose.model('Team', teamSchema);
