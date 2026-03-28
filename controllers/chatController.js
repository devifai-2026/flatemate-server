const asyncHandler = require('../utils/asyncHandler');
const chatService = require('../services/chatService');
const notificationService = require('../services/notificationService');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.user.id);
  res.status(200).json({ success: true, data: conversations });
});

const getMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getMessages(req.params.conversationId, req.user.id, req.query);
  res.status(200).json({ success: true, ...result });
});

const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(req.params.conversationId, req.user.id, {
    text: req.body.text,
    mediaType: req.body.mediaType,
    mediaUrl: req.body.mediaUrl,
    location: req.body.location,
  });

  const io = req.app.get('io');
  const conversationId = req.params.conversationId;

  try {
    const convo = await Conversation.findById(conversationId);
    const sender = await User.findById(req.user.id).select('name profileImage').lean();
    const previewText = req.body.text
      ? (req.body.text.length > 50 ? req.body.text.slice(0, 50) + '...' : req.body.text)
      : (req.body.mediaType === 'image' ? '📷 Photo' : req.body.mediaType === 'audio' ? '🎙️ Voice' : req.body.mediaType === 'video' ? '🎬 Video' : req.body.mediaType === 'location' ? '📍 Location' : 'Message');

    // Emit new-message via socket so recipient's chat updates in real-time
    const populatedMsg = await require('../models/Message').findById(message._id).populate('sender', 'name profileImage phone').lean();

    if (convo?.isGroup) {
      // Emit to conversation room
      if (io) io.to(`conv:${conversationId}`).emit('new-message', { conversationId, message: populatedMsg });

      for (const pid of convo.participants) {
        if (pid.toString() !== req.user.id) {
          const notif = await notificationService.create({
            user: pid,
            type: 'message',
            title: `${sender?.name || 'Someone'} in ${convo.groupName || 'Team'}`,
            body: previewText,
            link: { type: 'chat', id: conversationId },
            fromUser: req.user.id,
          });
          if (io) io.to(`user:${pid}`).emit('new-notification', notif);
          if (io) io.to(`user:${pid}`).emit('new-message', { conversationId, message: populatedMsg });
        }
      }
    } else {
      const recipientId = convo?.participants.find((p) => p.toString() !== req.user.id);
      if (recipientId) {
        // Emit to conversation room + recipient's personal room
        if (io) {
          io.to(`conv:${conversationId}`).emit('new-message', { conversationId, message: populatedMsg });
          io.to(`user:${recipientId.toString()}`).emit('new-message', { conversationId, message: populatedMsg });
        }

        const notif = await notificationService.create({
          user: recipientId,
          type: 'message',
          title: `${sender?.name || 'Someone'} sent you a message`,
          body: previewText,
          link: { type: 'chat', id: conversationId },
          fromUser: req.user.id,
        });
        if (io) io.to(`user:${recipientId.toString()}`).emit('new-notification', notif);
      }
    }
  } catch (err) {
    console.error('[Chat] Notification/socket error:', err.message);
  }

  res.status(201).json({ success: true, data: message });
});

const sendDirectMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendDirectMessage(req.user.id, req.body.receiverId, req.body.text);

  // Emit socket events so recipient gets real-time update
  const io = req.app.get('io');
  if (io && result.message && result.conversation) {
    try {
      const sender = await User.findById(req.user.id).select('name').lean();
      const convId = result.conversation._id.toString();
      const recipientId = req.body.receiverId;
      const populatedMsg = await require('../models/Message').findById(result.message._id).populate('sender', 'name profileImage phone').lean();

      io.to(`conv:${convId}`).emit('new-message', { conversationId: convId, message: populatedMsg });
      io.to(`user:${recipientId}`).emit('new-message', { conversationId: convId, message: populatedMsg });

      const notif = await notificationService.create({
        user: recipientId,
        type: 'message',
        title: `${sender?.name || 'Someone'} sent you a message`,
        body: req.body.text?.slice(0, 50) || 'New message',
        link: { type: 'chat', id: convId },
        fromUser: req.user.id,
      });
      io.to(`user:${recipientId}`).emit('new-notification', notif);
    } catch (err) {
      console.error('[Chat] Direct msg socket error:', err.message);
    }
  }

  res.status(201).json({ success: true, data: result });
});

const markAsRead = asyncHandler(async (req, res) => {
  await chatService.markAsRead(req.params.conversationId, req.user.id);
  res.status(200).json({ success: true, message: 'Marked as read' });
});

const deleteMessage = asyncHandler(async (req, res) => {
  await chatService.deleteMessage(req.params.messageId, req.user.id);
  res.status(200).json({ success: true, message: 'Message deleted' });
});

const blockUser = asyncHandler(async (req, res) => {
  const result = await chatService.blockUser(req.user.id, req.body.userId);
  res.status(200).json({ success: true, data: result });
});

const unblockUser = asyncHandler(async (req, res) => {
  const result = await chatService.unblockUser(req.user.id, req.body.userId);
  res.status(200).json({ success: true, data: result });
});

module.exports = { getConversations, getMessages, sendMessage, sendDirectMessage, markAsRead, deleteMessage, blockUser, unblockUser };
