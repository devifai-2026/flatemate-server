require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./utils/socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // Create HTTP server and attach Socket.io
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*', // tighten in production
      methods: ['GET', 'POST'],
    },
  });

  // Initialize Socket.io event handlers
  initSocket(io);

  // Make io accessible in request handlers if needed
  app.set('io', io);

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`API docs available at http://localhost:${PORT}/api-docs`);
    console.log(`Socket.io ready on port ${PORT}`);
  });
};

start();
