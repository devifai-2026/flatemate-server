const asyncHandler = require('../utils/asyncHandler');
const chatService = require('../services/chatService');

/** GET /api/chat/conversations */
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.getConversations(req.user.id);
  res.status(200).json({ success: true, data: conversations });
});

/** GET /api/chat/:conversationId/messages */
const getMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getMessages(
    req.params.conversationId,
    req.user.id,
    req.query
  );
  res.status(200).json({ success: true, ...result });
});

/** POST /api/chat/:conversationId/messages — Send to existing conversation */
const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(
    req.params.conversationId,
    req.user.id,
    req.body.text
  );
  res.status(201).json({ success: true, data: message });
});

/** POST /api/messages — Send a direct message (creates conversation if needed) */
const sendDirectMessage = asyncHandler(async (req, res) => {
  const { receiverId, text } = req.body;
  const result = await chatService.sendDirectMessage(req.user.id, receiverId, text);
  res.status(201).json({ success: true, data: result });
});

/** PUT /api/chat/:conversationId/read */
const markAsRead = asyncHandler(async (req, res) => {
  await chatService.markAsRead(req.params.conversationId, req.user.id);
  res.status(200).json({ success: true, message: 'Messages marked as read' });
});

module.exports = { getConversations, getMessages, sendMessage, sendDirectMessage, markAsRead };
