const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');

/**
 * Socket.io initialization and event handlers.
 * Clients must send the JWT token in the `auth.token` field when connecting.
 *
 * Events:
 *   Client → Server:
 *     - join-conversation  { conversationId }
 *     - send-message       { conversationId, text }
 *     - mark-read          { conversationId }
 *     - typing             { conversationId }
 *
 *   Server → Client:
 *     - new-message        { message }
 *     - user-typing        { conversationId, userId }
 *     - error              { message }
 */
const initSocket = (io) => {
  // ── Auth middleware — verify JWT before allowing connection ──
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Join a personal room so we can push events to this user specifically
    socket.join(`user:${userId}`);

    // ── Join a conversation room ──
    socket.on('join-conversation', ({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
    });

    // ── Send a message ──
    socket.on('send-message', async ({ conversationId, text }) => {
      try {
        const message = await chatService.sendMessage(conversationId, userId, text);

        // Broadcast to all participants in the conversation room
        io.to(`conv:${conversationId}`).emit('new-message', {
          conversationId,
          message,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Mark messages as read ──
    socket.on('mark-read', async ({ conversationId }) => {
      try {
        await chatService.markAsRead(conversationId, userId);
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Typing indicator ──
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user-typing', {
        conversationId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      // cleanup if needed
    });
  });
};

module.exports = initSocket;
