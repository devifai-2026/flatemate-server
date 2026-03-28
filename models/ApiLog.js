const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema(
  {
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: Number,
    responseTime: Number, // ms
    ip: String,
    userAgent: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isGuest: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    error: String,
  },
  { timestamps: true }
);

apiLogSchema.index({ createdAt: -1 });
apiLogSchema.index({ path: 1, method: 1 });
apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // auto-delete after 30 days

module.exports = mongoose.model('ApiLog', apiLogSchema);
