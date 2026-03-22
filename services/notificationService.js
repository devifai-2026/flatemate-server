const Notification = require('../models/Notification');

const create = async ({ user, type, title, body, link, fromUser }) => {
  return Notification.create({ user, type, title, body, link, fromUser });
};

const getAll = async (userId, { page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId })
      .populate('fromUser', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, read: false }),
  ]);
  return { notifications, unreadCount, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } };
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, read: false });
};

const markAsRead = async (notificationId, userId) => {
  await Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true });
};

const markAllAsRead = async (userId) => {
  await Notification.updateMany({ user: userId, read: false }, { read: true });
};

const remove = async (notificationId, userId) => {
  await Notification.findOneAndDelete({ _id: notificationId, user: userId });
};

const clearAll = async (userId) => {
  await Notification.deleteMany({ user: userId });
};

module.exports = { create, getAll, getUnreadCount, markAsRead, markAllAsRead, remove, clearAll };
