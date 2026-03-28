const env = process.env.NODE_ENV || 'development';
require('dotenv').config({ path: `.env.${env}` });

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
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
    transports: ['websocket', 'polling'],
  });

  // Initialize Socket.io event handlers
  initSocket(io);

  // Make io accessible in request handlers if needed
  app.set('io', io);

  server.listen(PORT, () => {
    const base = IS_PROD ? 'https://justflatmate.in' : `http://localhost:${PORT}`;
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`API: ${base}`);
    console.log(`Socket.io ready on port ${PORT}`);
  });
};

start();
