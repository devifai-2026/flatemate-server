const mongoose = require('mongoose');

const bonusConfigSchema = new mongoose.Schema(
  {
    // Singleton key — always 'default'
    key: { type: String, default: 'default', unique: true },

    // Tokens auto-credited to a user on first successful OTP verification
    signupBonus: { type: Number, default: 0, min: 0 },

    // Tokens to push to every existing (non-blocked, non-admin) user via the
    // "credit existing" admin action. Stored so the admin UI can display the
    // most recently configured value alongside signupBonus.
    existingUserBonus: { type: Number, default: 0, min: 0 },

    lastBulkCreditedAt: { type: Date },
    lastBulkCreditedAmount: { type: Number },
    lastBulkCreditedCount: { type: Number },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bonusConfigSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ key: 'default' });
  if (!doc) doc = await this.create({ key: 'default' });
  return doc;
};

module.exports = mongoose.model('BonusConfig', bonusConfigSchema);
