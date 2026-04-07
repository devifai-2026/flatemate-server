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
// ✅ FULL OPEN CORS (ALLOW EVERYTHING)
// ─────────────────────────────────────────────
const corsOptions = {
  origin: true, // reflect request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
  ],
  exposedHeaders: ['Authorization'],
};

app.use(cors(corsOptions));

// Explicit preflight handling (must use same options)
app.options('*', cors(corsOptions));

// ─────────────────────────────────────────────
// 🔐 SECURITY (RELAXED)
// ─────────────────────────────────────────────
app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: '1mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Custom logger
app.use(apiLogger);

// ─────────────────────────────────────────────
// 📄 SWAGGER
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
// 🔗 DEEP LINK FILES
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
// ❌ ERROR HANDLER
// ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
