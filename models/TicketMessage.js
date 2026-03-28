const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, maxlength: 5000 },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

ticketMessageSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('TicketMessage', ticketMessageSchema);
