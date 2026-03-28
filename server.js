const path = require('path');
const env = process.env.NODE_ENV || 'development';
const envPath = path.join(__dirname, `.env.${env}`);
const dotenvResult = require('dotenv').config({ path: envPath });
if (dotenvResult.error) {
  console.error(`[DOTENV] Failed to load ${envPath}:`, dotenvResult.error.message);
  // Fallback — try .env
  require('dotenv').config();
} else {
  console.log(`[DOTENV] Loaded ${envPath} (${Object.keys(dotenvResult.parsed || {}).length} vars)`);
}
console.log(`[ENV] JWT_SECRET: ${process.env.JWT_SECRET ? 'SET (' + process.env.JWT_SECRET.slice(0, 8) + '...)' : 'MISSING!'}`);
console.log(`[ENV] RAZORPAY_KEY_ID: ${process.env.RAZORPAY_KEY_ID ? 'SET' : 'MISSING!'}`);
console.log(`[ENV] MONGO_URI: ${process.env.MONGO_URI ? 'SET' : 'MISSING!'}`);


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
    const base = process.env.BASE_URL || `http://localhost:${PORT}`;
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`API: ${base}`);
    console.log(`Socket.io ready on port ${PORT}`);
  });
};

start();
