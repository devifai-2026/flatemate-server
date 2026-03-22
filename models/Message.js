const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // 'user' = normal message, 'system' = join/leave notifications
    messageType: {
      type: String,
      enum: ['user', 'system'],
      default: 'user',
    },
    text: {
      type: String,
      maxlength: 5000,
      default: '',
    },
    // Media support — audio, video, image
    mediaType: {
      type: String,
      enum: ['text', 'image', 'audio', 'video', 'location'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    // Location sharing
    location: {
      lat: Number,
      lng: Number,
      label: String,
    },
    // Tick status: sent = ✓, delivered = ✓✓, read = ✓✓ (blue)
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Soft delete for individual users
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
