const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

const getAll = asyncHandler(async (req, res) => {
  const result = await notificationService.getAll(req.user.id, req.query);
  res.status(200).json({ success: true, data: result });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.status(200).json({ success: true, data: { count } });
});

const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Marked as read' });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.status(200).json({ success: true, message: 'All marked as read' });
});

const remove = asyncHandler(async (req, res) => {
  await notificationService.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Deleted' });
});

const clearAll = asyncHandler(async (req, res) => {
  await notificationService.clearAll(req.user.id);
  res.status(200).json({ success: true, message: 'All cleared' });
});

module.exports = { getAll, getUnreadCount, markAsRead, markAllAsRead, remove, clearAll };
