const mongoose = require('mongoose');

const guestActivitySchema = new mongoose.Schema(
  {
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    ip: String,
    userAgent: String,
    device: {
      type: { type: String }, // mobile, desktop, tablet
      os: String,
      browser: String,
    },
    city: String,
    country: String,
    pages: [
      {
        path: String,
        title: String,
        visitedAt: { type: Date, default: Date.now },
        duration: Number, // seconds spent on page
      },
    ],
    referrer: String,
    totalVisits: { type: Number, default: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    convertedToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

guestActivitySchema.index({ lastSeenAt: -1 });
guestActivitySchema.index({ firstSeenAt: -1 });

module.exports = mongoose.model('GuestActivity', guestActivitySchema);
