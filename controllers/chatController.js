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

  // Create notification for recipient(s) — same as socket handler
  try {
    const convo = await Conversation.findById(req.params.conversationId);
    const sender = await User.findById(req.user.id).select('name').lean();
    const previewText = req.body.text
      ? (req.body.text.length > 50 ? req.body.text.slice(0, 50) + '...' : req.body.text)
      : (req.body.mediaType || 'Message');

    if (convo?.isGroup) {
      for (const pid of convo.participants) {
        if (pid.toString() !== req.user.id) {
          await notificationService.create({
            user: pid,
            type: 'message',
            title: `${sender?.name || 'Someone'} in ${convo.groupName || 'Team'}`,
            body: previewText,
            link: { type: 'chat', id: req.params.conversationId },
            fromUser: req.user.id,
          });
        }
      }
    } else {
      const recipientId = convo?.participants.find((p) => p.toString() !== req.user.id);
      if (recipientId) {
        await notificationService.create({
          user: recipientId,
          type: 'message',
          title: `${sender?.name || 'Someone'} sent you a message`,
          body: previewText,
          link: { type: 'chat', id: req.params.conversationId },
          fromUser: req.user.id,
        });
      }
    }
  } catch (err) {
    console.error('[Chat] Notification creation error:', err.message);
  }

  res.status(201).json({ success: true, data: message });
});

const sendDirectMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendDirectMessage(req.user.id, req.body.receiverId, req.body.text);
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
