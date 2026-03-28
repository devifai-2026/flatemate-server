const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const Room = require('../models/Room');
const PG = require('../models/PG');
const Requirement = require('../models/Requirement');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const WalletTransaction = require('../models/WalletTransaction');
const UnlockedListing = require('../models/UnlockedListing');
const Notification = require('../models/Notification');
const Team = require('../models/Team');
const Ticket = require('../models/Ticket');
const TicketMessage = require('../models/TicketMessage');
const Wishlist = require('../models/Wishlist');

const router = Router();

// ═══════════════════════════════════════════
// ADMIN AUTH (email + password, no OTP)
// ═══════════════════════════════════════════

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email: email.toLowerCase(), isAdmin: true }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);
  if (!user.password) throw new AppError('Password not set for this account. Contact super admin.', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const token = jwt.sign(
    { id: user._id, phone: user.phone, verified: true },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  const { password: _, ...userData } = user.toObject();
  res.json({ success: true, data: { token, user: userData } });
}));

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw new AppError('Email, password, and name are required', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('Email already registered', 409);

  const admin = await User.create({
    email: email.toLowerCase(),
    password,
    name,
    phone: `admin_${Date.now()}`,
    isAdmin: true,
    verified: true,
    phoneVerified: true,
  });

  const { password: _, ...userData } = admin.toObject();
  res.status(201).json({ success: true, data: userData });
}));

// ── Protected admin routes ──
router.use(protect, adminOnly);

// ═══════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════

router.get('/analytics', asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newUsersThisMonth, newUsersThisWeek,
    totalRooms, totalPGs, totalRequirements,
    hiddenRooms, hiddenPGs, hiddenRequirements,
    totalConversations, totalMessages,
    totalRecharges, rechargeRevenue,
    totalUnlocks, totalTeams,
    openTickets, totalTickets,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Room.countDocuments(),
    PG.countDocuments(),
    Requirement.countDocuments(),
    Room.countDocuments({ isHidden: true }),
    PG.countDocuments({ isHidden: true }),
    Requirement.countDocuments({ isHidden: true }),
    Conversation.countDocuments(),
    Message.countDocuments(),
    WalletTransaction.countDocuments({ type: 'recharge', paymentStatus: 'paid' }),
    WalletTransaction.aggregate([
      { $match: { type: 'recharge', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    UnlockedListing.countDocuments(),
    Team.countDocuments(),
    Ticket.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
    Ticket.countDocuments(),
  ]);

  // Daily signups for last 30 days
  const dailySignups = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Daily revenue for last 30 days
  const dailyRevenue = await WalletTransaction.aggregate([
    { $match: { type: 'recharge', paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, thisMonth: newUsersThisMonth, thisWeek: newUsersThisWeek },
      listings: {
        rooms: totalRooms, pgs: totalPGs, requirements: totalRequirements,
        total: totalRooms + totalPGs + totalRequirements,
        hidden: { rooms: hiddenRooms, pgs: hiddenPGs, requirements: hiddenRequirements },
      },
      engagement: { conversations: totalConversations, messages: totalMessages, teams: totalTeams, unlocks: totalUnlocks },
      revenue: { totalRecharges, totalRevenue: rechargeRevenue[0]?.total || 0 },
      tickets: { open: openTickets, total: totalTickets },
      charts: { dailySignups, dailyRevenue },
    },
  });
}));

// ═══════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════

router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, sort = '-createdAt' } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Get user's listings, wishlist, teams, transactions, conversations
  const [rooms, pgs, requirements, wishlist, teams, transactions, conversations] = await Promise.all([
    Room.find({ postedBy: req.params.id }).lean(),
    PG.find({ postedBy: req.params.id }).lean(),
    Requirement.find({ createdBy: req.params.id }).lean(),
    Wishlist.find({ user: req.params.id }).lean(),
    Team.find({ members: req.params.id }).lean(),
    WalletTransaction.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(50).lean(),
    Conversation.find({ participants: req.params.id }).populate('participants', 'name phone profileImage').sort({ updatedAt: -1 }).limit(20).lean(),
  ]);

  res.json({ success: true, data: { user, rooms, pgs, requirements, wishlist, teams, transactions, conversations } });
}));

// ═══════════════════════════════════════════
// LISTINGS MODERATION
// ═══════════════════════════════════════════

router.get('/listings', asyncHandler(async (req, res) => {
  const { type = 'room', page = 1, limit = 20, hidden, search } = req.query;
  let Model = Room, ownerField = 'postedBy';
  if (type === 'pg') Model = PG;
  if (type === 'requirement') { Model = Requirement; ownerField = 'createdBy'; }

  const filter = {};
  if (hidden === 'true') filter.isHidden = true;
  if (hidden === 'false') filter.isHidden = { $ne: true };
  if (search) filter.title = new RegExp(search, 'i');

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Model.find(filter).populate(ownerField, 'name phone profileImage').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Model.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
}));

router.put('/listings/:type/:id/toggle-hide', asyncHandler(async (req, res) => {
  let Model;
  if (req.params.type === 'room') Model = Room;
  else if (req.params.type === 'pg') Model = PG;
  else if (req.params.type === 'requirement') Model = Requirement;
  else return res.status(400).json({ success: false, message: 'Invalid type' });

  const item = await Model.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  item.isHidden = !item.isHidden;
  await item.save();
  res.json({ success: true, data: item, message: item.isHidden ? 'Listing hidden' : 'Listing visible' });
}));

// ═══════════════════════════════════════════
// CHATS MONITOR
// ═══════════════════════════════════════════

router.get('/chats', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = {};
  const skip = (Number(page) - 1) * Number(limit);
  const [convos, total] = await Promise.all([
    Conversation.find(filter)
      .populate('participants', 'name phone profileImage')
      .populate('team', 'name')
      .sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Conversation.countDocuments(filter),
  ]);
  res.json({ success: true, data: convos, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
}));

router.get('/chats/:conversationId/messages', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [messages, total] = await Promise.all([
    Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name phone profileImage')
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Message.countDocuments({ conversation: req.params.conversationId }),
  ]);
  res.json({ success: true, data: messages.reverse(), pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
}));

// ═══════════════════════════════════════════
// TICKETS
// ═══════════════════════════════════════════

router.get('/tickets', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, category } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  const skip = (Number(page) - 1) * Number(limit);
  const [tickets, total] = await Promise.all([
    Ticket.find(filter).populate('user', 'name phone profileImage email').populate('assignedTo', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Ticket.countDocuments(filter),
  ]);
  res.json({ success: true, data: tickets, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
}));

router.get('/tickets/:id', asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate('user', 'name phone profileImage email city').populate('assignedTo', 'name');
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  const messages = await TicketMessage.find({ ticket: req.params.id }).populate('sender', 'name profileImage').sort({ createdAt: 1 }).lean();
  res.json({ success: true, data: { ticket, messages } });
}));

router.put('/tickets/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  ticket.status = status;
  if (status === 'resolved' || status === 'closed') ticket.resolvedAt = new Date();
  if (status === 'in-progress' && !ticket.assignedTo) ticket.assignedTo = req.user.id;
  await ticket.save();
  res.json({ success: true, data: ticket });
}));

router.post('/tickets/:id/messages', asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message required' });
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

  const msg = await TicketMessage.create({
    ticket: req.params.id,
    sender: req.user.id,
    senderRole: 'admin',
    text: text.trim(),
  });

  // Update ticket status to in-progress if open
  if (ticket.status === 'open') {
    ticket.status = 'in-progress';
    ticket.assignedTo = req.user.id;
    await ticket.save();
  }

  // Notify user
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${ticket.user.toString()}`).emit('ticket-update', { ticketId: ticket._id.toString(), message: msg });
  }

  const populated = await TicketMessage.findById(msg._id).populate('sender', 'name profileImage').lean();
  res.json({ success: true, data: populated });
}));

module.exports = router;
