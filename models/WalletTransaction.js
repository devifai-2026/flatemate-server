const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['recharge', 'debit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // Tokens credited (recharge) or debited (unlock)
    tokens: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 300,
    },
    // For recharges — Razorpay fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
    },
    // For debits — which listing was unlocked
    listingType: {
      type: String,
      enum: ['room', 'pg', 'requirement'],
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
