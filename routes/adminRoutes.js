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
const GuestActivity = require('../models/GuestActivity');
const ApiLog = require('../models/ApiLog');
const mongoose = require('mongoose');

const router = Router();

// ═══════════════════════════════════════════
// ADMIN AUTH (email + password, no OTP)
// ═══════════════════════════════════════════

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) throw new AppError('No account found with this email', 401);
  if (!user.isAdmin) throw new AppError('Access denied. Admin only.', 403);
  if (!user.password) throw new AppError('Password not set for this account', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid password', 401);

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
  const { period = '1m' } = req.query;

  // Calculate date range based on period
  let periodStart;
  if (period === '3m') periodStart = new Date(now - 90 * 24 * 60 * 60 * 1000);
  else if (period === '6m') periodStart = new Date(now - 180 * 24 * 60 * 60 * 1000);
  else if (period === 'year') periodStart = new Date(now.getFullYear(), 0, 1);
  else periodStart = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const useWeekly = period !== '1m';
  const dateGroupExpr = useWeekly
    ? { $dateToString: { format: '%Y-%U', date: '$createdAt' } }
    : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  const [
    totalUsers, newUsersThisMonth, newUsersThisWeek, newUsersPeriod,
    totalRooms, totalPGs, totalRequirements,
    hiddenRooms, hiddenPGs, hiddenRequirements,
    totalConversations, totalMessages,
    totalRecharges, rechargeRevenue, periodRevenue,
    totalUnlocks, totalTeams,
    openTickets, totalTickets, inProgressTickets, resolvedTickets,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: periodStart } }),
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
    WalletTransaction.aggregate([
      { $match: { type: 'recharge', paymentStatus: 'paid', createdAt: { $gte: periodStart } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    UnlockedListing.countDocuments(),
    Team.countDocuments(),
    Ticket.countDocuments({ status: 'open' }),
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: 'in-progress' }),
    Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
  ]);

  // Chart data for selected period
  const dailySignups = await User.aggregate([
    { $match: { createdAt: { $gte: periodStart } } },
    { $group: { _id: dateGroupExpr, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const dailyRevenue = await WalletTransaction.aggregate([
    { $match: { type: 'recharge', paymentStatus: 'paid', createdAt: { $gte: periodStart } } },
    { $group: { _id: dateGroupExpr, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // User type breakdown
  const userTypeBreakdown = await User.aggregate([
    { $group: { _id: '$userType', count: { $sum: 1 } } },
  ]);

  // Monthly signups for trend
  const monthlySignups = await User.aggregate([
    { $match: { createdAt: { $gte: periodStart } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Monthly revenue for trend
  const monthlyRevenue = await WalletTransaction.aggregate([
    { $match: { type: 'recharge', paymentStatus: 'paid', createdAt: { $gte: periodStart } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Recent users (last 10)
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name phone email city userType profileImage createdAt walletBalance verified')
    .lean();

  // Ticket category breakdown
  const ticketsByCategory = await Ticket.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  // Listing activity in period
  const [newRoomsPeriod, newPGsPeriod, newRequirementsPeriod] = await Promise.all([
    Room.countDocuments({ createdAt: { $gte: periodStart } }),
    PG.countDocuments({ createdAt: { $gte: periodStart } }),
    Requirement.countDocuments({ createdAt: { $gte: periodStart } }),
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, thisMonth: newUsersThisMonth, thisWeek: newUsersThisWeek, periodNew: newUsersPeriod },
      userTypeBreakdown,
      listings: {
        rooms: totalRooms, pgs: totalPGs, requirements: totalRequirements,
        total: totalRooms + totalPGs + totalRequirements,
        hidden: { rooms: hiddenRooms, pgs: hiddenPGs, requirements: hiddenRequirements },
        periodNew: { rooms: newRoomsPeriod, pgs: newPGsPeriod, requirements: newRequirementsPeriod },
      },
      engagement: { conversations: totalConversations, messages: totalMessages, teams: totalTeams, unlocks: totalUnlocks },
      revenue: {
        totalRecharges, totalRevenue: rechargeRevenue[0]?.total || 0,
        periodRevenue: periodRevenue[0]?.total || 0, periodRecharges: periodRevenue[0]?.count || 0,
      },
      tickets: { open: openTickets, inProgress: inProgressTickets, resolved: resolvedTickets, total: totalTickets },
      ticketsByCategory,
      charts: { dailySignups, dailyRevenue, monthlySignups, monthlyRevenue },
      recentUsers,
    },
  });
}));

// ═══════════════════════════════════════════
// LISTING COUNTS & RECENT LISTINGS
// ═══════════════════════════════════════════

router.get('/listings/counts', asyncHandler(async (req, res) => {
  const [rooms, pgs, requirements] = await Promise.all([
    Room.countDocuments(),
    PG.countDocuments(),
    Requirement.countDocuments(),
  ]);
  res.json({ success: true, data: { rooms, pgs, requirements } });
}));

router.get('/listings/recent', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 20);
  const [rooms, pgs, requirements] = await Promise.all([
    Room.find().populate('postedBy', 'name phone profileImage').sort({ createdAt: -1 }).limit(limit).lean(),
    PG.find().populate('postedBy', 'name phone profileImage').sort({ createdAt: -1 }).limit(limit).lean(),
    Requirement.find().populate('createdBy', 'name phone profileImage').sort({ createdAt: -1 }).limit(limit).lean(),
  ]);
  res.json({ success: true, data: { rooms, pgs, requirements } });
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

router.put('/users/:id/block', asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

  // Can't block yourself
  if (req.params.id === req.user.id) {
    throw new AppError('You cannot block yourself', 400);
  }
  // Can't block another admin
  if (targetUser.isAdmin) {
    throw new AppError('Cannot block an admin user', 403);
  }

  targetUser.isBlocked = true;
  targetUser.blockedAt = new Date();
  targetUser.blockedBy = req.user.id;
  await targetUser.save();

  res.json({ success: true, message: 'User blocked', data: targetUser });
}));

router.put('/users/:id/unblock', asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

  targetUser.isBlocked = false;
  targetUser.blockedAt = undefined;
  targetUser.blockedBy = undefined;
  await targetUser.save();

  res.json({ success: true, message: 'User unblocked', data: targetUser });
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

router.get('/listings/:type/:id', asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  let Model, ownerField = 'postedBy';
  if (type === 'room') Model = Room;
  else if (type === 'pg') Model = PG;
  else if (type === 'requirement') { Model = Requirement; ownerField = 'createdBy'; }
  else return res.status(400).json({ success: false, message: 'Invalid type. Use room, pg, or requirement' });

  const item = await Model.findById(id).populate(ownerField, 'name phone email profileImage city').lean();
  if (!item) return res.status(404).json({ success: false, message: 'Listing not found' });
  res.json({ success: true, data: item });
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

// ═══════════════════════════════════════════
// GUEST ACTIVITY
// ═══════════════════════════════════════════

router.get('/guests', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort = '-lastSeenAt' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const [guests, total] = await Promise.all([
    GuestActivity.find({ convertedToUser: null })
      .sort(sort).skip(skip).limit(Number(limit)).lean(),
    GuestActivity.countDocuments({ convertedToUser: null }),
  ]);
  res.json({ success: true, data: guests, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
}));

router.get('/guests/stats', asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [totalGuests, todayGuests, weekGuests, converted, topPages] = await Promise.all([
    GuestActivity.countDocuments({ convertedToUser: null }),
    GuestActivity.countDocuments({ lastSeenAt: { $gte: today }, convertedToUser: null }),
    GuestActivity.countDocuments({ lastSeenAt: { $gte: sevenDaysAgo }, convertedToUser: null }),
    GuestActivity.countDocuments({ convertedToUser: { $ne: null } }),
    GuestActivity.aggregate([
      { $match: { lastSeenAt: { $gte: thirtyDaysAgo } } },
      { $unwind: '$pages' },
      { $group: { _id: '$pages.path', visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 10 },
    ]),
  ]);

  // Daily guest visits for last 30 days
  const dailyGuests = await GuestActivity.aggregate([
    { $match: { firstSeenAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$firstSeenAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: { totalGuests, todayGuests, weekGuests, converted, topPages, dailyGuests },
  });
}));

router.get('/guests/:id', asyncHandler(async (req, res) => {
  const guest = await GuestActivity.findById(req.params.id).lean();
  if (!guest) return res.status(404).json({ success: false, message: 'Guest not found' });
  res.json({ success: true, data: guest });
}));

// ═══════════════════════════════════════════
// API ACTIVITY
// ═══════════════════════════════════════════

router.get('/api-logs/errors', asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const errors = await ApiLog.aggregate([
    { $match: { statusCode: { $gte: 400 }, createdAt: { $gte: sevenDaysAgo } } },
    { $group: {
      _id: { method: '$method', path: '$path', status: '$statusCode' },
      count: { $sum: 1 },
      lastSeen: { $max: '$createdAt' },
      lastError: { $last: '$error' },
    }},
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);
  res.json({ success: true, data: errors });
}));

router.get('/api-logs', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, method, path, status } = req.query;
  const filter = {};
  if (method) filter.method = method.toUpperCase();
  if (path) filter.path = new RegExp(path, 'i');
  if (status) filter.statusCode = Number(status);

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    ApiLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    ApiLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: logs, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
}));

router.get('/api-logs/stats', asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [totalToday, totalWeek, errorCount, topEndpoints, avgResponseTime, hourlyTraffic] = await Promise.all([
    ApiLog.countDocuments({ createdAt: { $gte: today } }),
    ApiLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ApiLog.countDocuments({ createdAt: { $gte: today }, statusCode: { $gte: 400 } }),
    ApiLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { method: '$method', path: '$path' }, count: { $sum: 1 }, avgTime: { $avg: '$responseTime' } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]),
    ApiLog.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, avg: { $avg: '$responseTime' } } },
    ]),
    ApiLog.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Error breakdown by endpoint
  const errorBreakdown = await ApiLog.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo }, statusCode: { $gte: 400 } } },
    { $group: { _id: { method: '$method', path: '$path', status: '$statusCode' }, count: { $sum: 1 }, lastSeen: { $max: '$createdAt' } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  // Response time scatter data (sampled)
  const responseTimeDistribution = await ApiLog.aggregate([
    { $match: { createdAt: { $gte: today } } },
    { $project: { hour: { $hour: '$createdAt' }, minute: { $minute: '$createdAt' }, responseTime: 1, statusCode: 1, method: 1, path: 1 } },
    { $sample: { size: 200 } },
  ]);

  // Daily request counts for last 7 days
  const dailyRequests = await ApiLog.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      total: { $sum: 1 },
      errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
      avgTime: { $avg: '$responseTime' },
    }},
    { $sort: { _id: 1 } },
  ]);

  // Status code distribution
  const statusDistribution = await ApiLog.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: '$statusCode', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalToday,
      totalWeek,
      errorCount,
      topEndpoints,
      avgResponseTime: avgResponseTime[0]?.avg || 0,
      hourlyTraffic,
      errorBreakdown,
      responseTimeDistribution,
      dailyRequests,
      statusDistribution,
    },
  });
}));

// ═══════════════════════════════════════════
// DB STORAGE
// ═══════════════════════════════════════════

router.get('/db-stats', asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const dbStats = await db.command({ dbStats: 1 });

  const collections = await db.listCollections().toArray();
  const collectionStats = await Promise.all(
    collections.map(async (col) => {
      const [stats] = await db.collection(col.name).aggregate([
        { $collStats: { storageStats: {} } },
      ]).toArray();
      const s = stats?.storageStats || {};
      return {
        name: col.name,
        count: s.count || 0,
        size: s.size || 0,
        avgObjSize: s.avgObjSize || 0,
        storageSize: s.storageSize || 0,
        indexes: s.nindexes || 0,
        indexSize: s.totalIndexSize || 0,
      };
    })
  );

  collectionStats.sort((a, b) => b.size - a.size);

  res.json({
    success: true,
    data: {
      dbName: dbStats.db,
      dataSize: dbStats.dataSize,
      storageSize: dbStats.storageSize,
      indexSize: dbStats.indexSize,
      collections: dbStats.collections,
      totalDocuments: dbStats.objects,
      collectionStats,
    },
  });
}));

module.exports = router;
