const mongoose = require('mongoose');

/**
 * An Enquiry represents a paid connection request (₹19) between
 * an interested user and a listing (room or roommate).
 * One enquiry per unique (user + listing) combination.
 */
const enquirySchema = new mongoose.Schema(
  {
    // The user who is paying to connect
    enquirer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The listing being enquired about
    listingType: {
      type: String,
      enum: ['room', 'roommate'],
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'listingType === "room" ? "Room" : "RoommateListing"',
    },
    // Owner of the listing
    listingOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Payment ──
    amount: {
      type: Number,
      required: true,
      default: 1900, // 1900 paise = ₹19
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    // ── Access granted after payment ──
    canChat: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One enquiry per user per listing
enquirySchema.index({ enquirer: 1, listingId: 1 }, { unique: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
