const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['message', 'enquiry', 'match', 'team_join', 'team_wishlist', 'system'],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, maxlength: 500 },
    read: { type: Boolean, default: false },
    // Optional link data
    link: {
      type: { type: String, enum: ['chat', 'room', 'pg', 'team', 'profile'] },
      id: String,
    },
    // Who triggered it
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
