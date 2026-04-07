const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const errorHandler = require('./middleware/errorHandler');
const apiLogger = require('./middleware/apiLogger');
const path = require('path');

const app = express();

// ─────────────────────────────────────────────
// ✅ CORS CONFIG (IMPORTANT FIX)
// ─────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://justflatmate.in',
  'https://www.justflatmate.in',
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Handle preflight requests explicitly
app.options('*', cors());

// ─────────────────────────────────────────────
// 🔐 SECURITY + BASIC MIDDLEWARE
// ─────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(express.json({ limit: '1mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Custom API logger
app.use(apiLogger);

// ─────────────────────────────────────────────
// 📄 SWAGGER DOCS
// ─────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─────────────────────────────────────────────
// 🚀 ROUTES
// ─────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/roommates', require('./routes/roommateRoutes'));
app.use('/api/requirements', require('./routes/requirementRoutes'));
app.use('/api/match', require('./routes/matchRoutes'));
app.use('/api/enquiry', require('./routes/enquiryRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/onboarding', require('./routes/onboardingRoutes'));
app.use('/api/pgs', require('./routes/pgRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/guest', require('./routes/guestRoutes'));

// ─────────────────────────────────────────────
// 🔗 DEEP LINK CONFIG
// ─────────────────────────────────────────────
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: 'TEAM_ID.in.justflatmate.app',
          paths: ['/rooms/*', '/pgs/*', '/roommates/*'],
        },
      ],
    },
  });
});

app.get('/.well-known/assetlinks.json', (req, res) => {
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'in.justflatmate.app',
        sha256_cert_fingerprints: [
          '7B:5C:AC:EC:7B:BB:34:03:27:2A:DF:49:C0:36:7A:13:A4:2B:67:49:B1:D9:B6:51:55:9C:DF:81:02:A6:14:F4',
        ],
      },
    },
  ]);
});

// ─────────────────────────────────────────────
// 🏠 ROOT + HEALTH
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'FlatMate API',
    version: '1.0.0',
    env: process.env.NODE_ENV,
    status: 'running',
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// ❌ ERROR HANDLER (LAST)
// ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
