const path = require('path');
const env = process.env.NODE_ENV || 'development';
const envPath = path.join(__dirname, `.env.${env}`);

const dotenvResult = require('dotenv').config({ path: envPath });

if (dotenvResult.error) {
  console.error(`[DOTENV] Failed to load ${envPath}`);
  require('dotenv').config();
}

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./utils/socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const server = http.createServer(app);

  // ✅ FULL OPEN SOCKET CORS
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  initSocket(io);

  app.set('io', io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
