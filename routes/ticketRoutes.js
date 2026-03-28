const { Router } = require('express');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const Ticket = require('../models/Ticket');
const TicketMessage = require('../models/TicketMessage');

const router = Router();
router.use(protect);

// Create ticket
router.post('/', asyncHandler(async (req, res) => {
  const { subject, description, category, priority } = req.body;
  if (!subject?.trim() || !description?.trim()) return res.status(400).json({ success: false, message: 'Subject and description required' });

  const ticket = await Ticket.create({ user: req.user.id, subject: subject.trim(), description: description.trim(), category, priority });

  // Create initial message from description
  await TicketMessage.create({ ticket: ticket._id, sender: req.user.id, senderRole: 'user', text: description.trim() });

  // Notify admins via socket
  const io = req.app.get('io');
  if (io) {
    const populated = await Ticket.findById(ticket._id).populate('user', 'name phone profileImage email').lean();
    io.to('admin-room').emit('ticket-created', populated);
  }

  res.status(201).json({ success: true, data: ticket });
}));

// My tickets
router.get('/', asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: tickets });
}));

// Get ticket + messages
router.get('/:id', asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user.id }).lean();
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  const messages = await TicketMessage.find({ ticket: req.params.id }).populate('sender', 'name profileImage').sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: { ticket, messages } });
}));

// Send message (user side)
router.post('/:id/messages', asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message required' });
  const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user.id });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  if (ticket.status === 'resolved' || ticket.status === 'closed') return res.status(400).json({ success: false, message: 'Ticket is closed' });

  const msg = await TicketMessage.create({ ticket: req.params.id, sender: req.user.id, senderRole: 'user', text: text.trim() });
  const populated = await TicketMessage.findById(msg._id).populate('sender', 'name profileImage').lean();

  // Notify admins via socket
  const io = req.app.get('io');
  if (io) {
    io.to('admin-room').emit('ticket-message', { ticketId: ticket._id.toString(), message: populated, fromUser: true });
  }

  res.json({ success: true, data: populated });
}));

module.exports = router;
