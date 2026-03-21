const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
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

const app = express();

// ── Global Middleware ──
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting — 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler (must be last) ──
app.use(errorHandler);

module.exports = app;
