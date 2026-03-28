const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');
const notificationService = require('../services/notificationService');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Track online users: userId → Set of socketIds (multiple tabs)
const onlineUsers = new Map();

const initSocket = (io) => {
  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User connected: ${userId} (${socket.id})`);

    // Track online — support multiple tabs
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Join personal room
    socket.join(`user:${userId}`);

    // Admin users join admin room for ticket notifications
    const User = require('../models/User');
    const adminUser = await User.findById(userId).select('isAdmin').lean();
    if (adminUser?.isAdmin) {
      socket.join('admin-room');
      console.log(`[Socket] Admin joined admin-room: ${userId}`);
    }

    // Mark pending messages as delivered + notify senders
    try {
      const deliveredResult = await chatService.markAsDelivered(userId);
      // Broadcast delivery status to senders
      if (deliveredResult?.updatedConversations) {
        for (const { conversationId, senderIds } of deliveredResult.updatedConversations) {
          for (const sid of senderIds) {
            io.to(`user:${sid}`).emit('messages-delivered', { conversationId });
          }
          io.to(`conv:${conversationId}`).emit('messages-delivered', { conversationId });
        }
      }
    } catch (err) {
      console.error('[Socket] markAsDelivered error:', err.message);
    }

    // Broadcast online status
    io.emit('user-online', { userId });

    // ── Join conversation room ──
    socket.on('join-conversation', ({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave-conversation', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    // ── Send message ──
    socket.on('send-message', async ({ conversationId, text, mediaType, mediaUrl, location }) => {
      try {
        console.log(`[Socket] send-message from ${userId} in conv ${conversationId}`);
        const message = await chatService.sendMessage(conversationId, userId, { text, mediaType, mediaUrl, location });

        // Send profanity warning to sender if detected
        if (message._doc?.profanityWarning || message.profanityWarning) {
          socket.emit('profanity-warning', { warning: message._doc?.profanityWarning || message.profanityWarning });
        }

        // Get conversation to find recipients
        const convo = await Conversation.findById(conversationId);

        // Send to conversation room
        io.to(`conv:${conversationId}`).emit('new-message', { conversationId, message });

        if (convo?.isGroup) {
          // Group chat: broadcast to all members' personal rooms
          const sender = await User.findById(userId).select('name').lean();
          const previewText = text ? (text.length > 50 ? text.slice(0, 50) + '...' : text) : (mediaType || 'Message');

          for (const participantId of convo.participants) {
            const pid = participantId.toString();
            io.to(`user:${pid}`).emit('new-message', { conversationId, message });

            // Notification for everyone except sender
            if (pid !== userId) {
              const notif = await notificationService.create({
                user: pid,
                type: 'message',
                title: `${sender?.name || 'Someone'} in ${convo.groupName || 'Team'}`,
                body: previewText,
                link: { type: 'chat', id: conversationId },
                fromUser: userId,
              });
              io.to(`user:${pid}`).emit('new-notification', notif);
            }
          }

          // Mark as delivered for online members
          const onlineMembers = convo.participants.filter((p) => p.toString() !== userId && onlineUsers.has(p.toString()));
          if (onlineMembers.length > 0) {
            await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
            io.to(`conv:${conversationId}`).emit('message-status', {
              conversationId, messageId: message._id.toString(), status: 'delivered',
            });
          }
        } else {
          // 1-on-1 chat: existing logic
          const recipientId = convo?.participants.find((p) => p.toString() !== userId)?.toString();

          if (recipientId) {
            io.to(`user:${recipientId}`).emit('new-message', { conversationId, message });
          }
          io.to(`user:${userId}`).emit('new-message', { conversationId, message });

          if (recipientId && onlineUsers.has(recipientId)) {
            await Message.findByIdAndUpdate(message._id, { status: 'delivered' });
            io.to(`conv:${conversationId}`).emit('message-status', {
              conversationId, messageId: message._id.toString(), status: 'delivered',
            });
            io.to(`user:${userId}`).emit('message-status', {
              conversationId, messageId: message._id.toString(), status: 'delivered',
            });
          }

          if (recipientId) {
            const sender = await User.findById(userId).select('name').lean();
            const previewText = text ? (text.length > 50 ? text.slice(0, 50) + '...' : text) : (mediaType || 'Message');
            const notif = await notificationService.create({
              user: recipientId,
              type: 'message',
              title: `${sender?.name || 'Someone'} sent you a message`,
              body: previewText,
              link: { type: 'chat', id: conversationId },
              fromUser: userId,
            });
            io.to(`user:${recipientId}`).emit('new-notification', notif);
          }
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Mark as read (blue double tick) ──
    socket.on('mark-read', async ({ conversationId }) => {
      try {
        console.log(`[Socket] mark-read from ${userId} in conv ${conversationId}`);
        await chatService.markAsRead(conversationId, userId);

        const convo = await Conversation.findById(conversationId);
        if (!convo) return;

        // Notify all other participants
        convo.participants.forEach((p) => {
          if (p.toString() !== userId) {
            io.to(`user:${p.toString()}`).emit('messages-read', { conversationId, readBy: userId });
          }
        });
        io.to(`conv:${conversationId}`).emit('messages-read', { conversationId, readBy: userId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Typing indicator ──
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user-typing', { conversationId, userId });

      // Also send to participants' personal rooms
      Conversation.findById(conversationId).then((convo) => {
        if (!convo) return;
        convo.participants.forEach((p) => {
          if (p.toString() !== userId) {
            io.to(`user:${p.toString()}`).emit('user-typing', { conversationId, userId });
          }
        });
      }).catch(() => {});
    });

    socket.on('stop-typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user-stop-typing', { conversationId, userId });

      Conversation.findById(conversationId).then((convo) => {
        if (!convo) return;
        convo.participants.forEach((p) => {
          if (p.toString() !== userId) {
            io.to(`user:${p.toString()}`).emit('user-stop-typing', { conversationId, userId });
          }
        });
      }).catch(() => {});
    });

    // ── Check online status ──
    socket.on('check-online', ({ userIds }, callback) => {
      const result = {};
      userIds.forEach((id) => { result[id] = onlineUsers.has(id); });
      if (callback) callback(result);
    });

    // ── Ping-pong heartbeat ──
    const pingInterval = setInterval(() => {
      socket.emit('ping-check');
    }, 15000);

    socket.on('pong-check', () => {
      // Client is alive
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      clearInterval(pingInterval);
      console.log(`[Socket] User disconnected: ${userId} (${socket.id})`);
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user-offline', { userId });
        }
      }
    });
  });
};

module.exports = initSocket;
