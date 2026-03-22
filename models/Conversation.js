const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // Group chat fields
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true, maxlength: 100 },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    // Track when each member joined — new members can't see older messages
    memberJoinedAt: {
      type: Map,
      of: Date,
      default: {},
    },
    // Optional — set when conversation was created via paid enquiry
    enquiry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
    },
    lastMessage: {
      text: String,
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sentAt: { type: Date },
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
