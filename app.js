const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const roommateRoutes = require('./routes/roommateRoutes');
const requirementRoutes = require('./routes/requirementRoutes');
const matchRoutes = require('./routes/matchRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const teamRoutes = require('./routes/teamRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const pgRoutes = require('./routes/pgRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const walletRoutes = require('./routes/walletRoutes');
const listingRoutes = require('./routes/listingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

const path = require('path');

// ── Global Middleware ──
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve uploaded files (chat media)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}


// ── Swagger Docs ──
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/roommates', roommateRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/enquiry', enquiryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/pgs', pgRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'FlatMate API',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    status: 'running',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler (must be last) ──
app.use(errorHandler);

module.exports = app;
