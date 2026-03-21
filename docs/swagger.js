const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Flatemate API',
    version: '3.0.0',
    description: 'Roommate & Room Finder platform — marketplace + matching engine with real-time chat, teams, requirements, and ₹19 pay-per-enquiry.',
  },
  servers: [{ url: 'http://localhost:8000', description: 'Development' }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          password: { type: 'string', minLength: 6, example: '123456' },
          phone: { type: 'string', example: '+919876543210' },
          age: { type: 'integer', example: 25 },
          gender: { type: 'string', enum: ['male', 'female', 'non-binary', 'other'] },
          occupation: { type: 'string', example: 'Software Engineer' },
          bio: { type: 'string', example: 'Love cooking and long walks' },
          profileImage: { type: 'string', format: 'uri' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          age: { type: 'integer' },
          gender: { type: 'string' },
          occupation: { type: 'string' },
          bio: { type: 'string' },
          profileImage: { type: 'string' },
          verified: { type: 'boolean' },
          phoneVerified: { type: 'boolean' },
          preferences: { $ref: '#/components/schemas/Preferences' },
        },
      },
      Preferences: {
        type: 'object',
        properties: {
          budgetMin: { type: 'number', example: 5000 },
          budgetMax: { type: 'number', example: 15000 },
          preferredLocation: { type: 'string', example: 'Mumbai' },
          lifestyle: {
            type: 'object',
            properties: {
              smoking: { type: 'boolean' },
              drinking: { type: 'boolean' },
              pets: { type: 'boolean' },
              sleepSchedule: { type: 'string', enum: ['early-bird', 'night-owl', 'flexible'] },
            },
          },
          interests: { type: 'array', items: { type: 'string' }, example: ['gaming', 'cooking'] },
          roommatePreferences: {
            type: 'object',
            properties: {
              ageMin: { type: 'integer' },
              ageMax: { type: 'integer' },
              gender: { type: 'string', enum: ['male', 'female', 'non-binary', 'any'] },
            },
          },
        },
      },
      RoomInput: {
        type: 'object',
        required: ['title', 'description', 'location', 'rent', 'availableFrom'],
        properties: {
          title: { type: 'string', example: 'Spacious 2BHK in Andheri' },
          description: { type: 'string' },
          location: { type: 'string', example: 'Andheri West, Mumbai' },
          rent: { type: 'number', example: 12000 },
          deposit: { type: 'number', example: 24000 },
          amenities: { type: 'array', items: { type: 'string' } },
          images: { type: 'array', items: { type: 'string', format: 'uri' } },
          availableFrom: { type: 'string', format: 'date', example: '2026-04-01' },
          preferredTenant: { type: 'string', enum: ['male', 'female', 'any', 'family', 'students', 'working-professionals'] },
          phoneVisibility: { type: 'string', enum: ['masked', 'reveal'] },
          contactPhone: { type: 'string' },
        },
      },
      RequirementInput: {
        type: 'object',
        required: ['type', 'title', 'budget', 'location'],
        properties: {
          type: { type: 'string', enum: ['room', 'flatmate'], example: 'room' },
          title: { type: 'string', example: 'Looking for 1BHK in Koramangala' },
          description: { type: 'string' },
          budget: {
            type: 'object',
            required: ['min', 'max'],
            properties: { min: { type: 'number', example: 5000 }, max: { type: 'number', example: 12000 } },
          },
          location: { type: 'string', example: 'Koramangala, Bangalore' },
          moveInDate: { type: 'string', format: 'date' },
          preferredRoommate: {
            type: 'object',
            properties: {
              gender: { type: 'string', enum: ['male', 'female', 'non-binary', 'any'] },
              ageMin: { type: 'integer' },
              ageMax: { type: 'integer' },
              occupation: { type: 'string' },
            },
          },
          lifestyle: {
            type: 'object',
            properties: {
              smoking: { type: 'boolean' },
              drinking: { type: 'boolean' },
              pets: { type: 'boolean' },
              sleepSchedule: { type: 'string', enum: ['early-bird', 'night-owl', 'flexible'] },
            },
          },
          notes: { type: 'string' },
          phoneVisibility: { type: 'string', enum: ['masked', 'reveal'] },
          contactPhone: { type: 'string' },
        },
      },
      TeamInput: {
        type: 'object',
        required: ['name', 'location'],
        properties: {
          name: { type: 'string', example: 'Mumbai Flatmates Group' },
          description: { type: 'string' },
          location: { type: 'string', example: 'Andheri, Mumbai' },
          budget: {
            type: 'object',
            properties: { min: { type: 'number' }, max: { type: 'number' } },
          },
          maxMembers: { type: 'integer', minimum: 2, maximum: 10, example: 4 },
        },
      },
      DirectMessageInput: {
        type: 'object',
        required: ['receiverId', 'text'],
        properties: {
          receiverId: { type: 'string', example: '665a1b2c3d4e5f6a7b8c9d0e' },
          text: { type: 'string', example: 'Hi, interested in your listing!' },
        },
      },
      MatchResult: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          matchScore: { type: 'integer', example: 78 },
          explanation: {
            type: 'object',
            properties: {
              budget: { type: 'object', properties: { score: { type: 'integer' }, maxScore: { type: 'integer' }, detail: { type: 'string' } } },
              location: { type: 'object', properties: { score: { type: 'integer' }, maxScore: { type: 'integer' }, detail: { type: 'string' } } },
              lifestyle: { type: 'object', properties: { score: { type: 'integer' }, maxScore: { type: 'integer' }, detail: { type: 'string' } } },
              interests: { type: 'object', properties: { score: { type: 'integer' }, maxScore: { type: 'integer' }, detail: { type: 'string' } } },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    // ── AUTH ──
    '/api/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register a new user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } } },
        responses: { 201: { description: 'User registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } }, 400: { description: 'Validation error' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
        responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        tags: ['Auth'], summary: 'Request password reset email',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: { 200: { description: 'Reset link sent' }, 404: { description: 'Email not found' } },
      },
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Auth'], summary: 'Reset password with token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string', minLength: 6 } } } } } },
        responses: { 200: { description: 'Password reset' }, 400: { description: 'Invalid token' } },
      },
    },
    '/api/auth/send-otp': {
      post: {
        tags: ['Auth'], summary: 'Send OTP to phone (MessageCentral)', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['phone'], properties: { phone: { type: 'string' } } } } } },
        responses: { 200: { description: 'OTP sent' }, 502: { description: 'SMS gateway error' } },
      },
    },
    '/api/auth/verify-otp': {
      post: {
        tags: ['Auth'], summary: 'Verify OTP', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['otp'], properties: { otp: { type: 'string' } } } } } },
        responses: { 200: { description: 'Phone verified' }, 400: { description: 'Invalid OTP' } },
      },
    },

    // ── USERS ──
    '/api/users/me': {
      get: {
        tags: ['Users'], summary: 'Get current user profile', security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'User profile' } },
      },
    },
    '/api/users/preferences': {
      put: {
        tags: ['Users'], summary: 'Update user preferences', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Preferences' } } } },
        responses: { 200: { description: 'Updated' } },
      },
    },

    // ── ROOMS ──
    '/api/rooms': {
      get: {
        tags: ['Rooms'], summary: 'List rooms with filters',
        parameters: [
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'minRent', in: 'query', schema: { type: 'number' } },
          { name: 'maxRent', in: 'query', schema: { type: 'number' } },
          { name: 'amenities', in: 'query', schema: { type: 'string' }, description: 'Comma-separated' },
          { name: 'preferredTenant', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'List of rooms' } },
      },
      post: {
        tags: ['Rooms'], summary: 'Create a room listing', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomInput' } } } },
        responses: { 201: { description: 'Room created' } },
      },
    },
    '/api/rooms/{id}': {
      get: {
        tags: ['Rooms'], summary: 'Get a room by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Room details' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['Rooms'], summary: 'Update a room', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomInput' } } } },
        responses: { 200: { description: 'Updated' }, 403: { description: 'Not authorized' } },
      },
      delete: {
        tags: ['Rooms'], summary: 'Delete a room', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ── REQUIREMENTS ──
    '/api/requirements': {
      get: {
        tags: ['Requirements'], summary: 'Browse requirements ("I am looking for...")',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['room', 'flatmate'] } },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'minBudget', in: 'query', schema: { type: 'number' } },
          { name: 'maxBudget', in: 'query', schema: { type: 'number' } },
          { name: 'gender', in: 'query', schema: { type: 'string' } },
          { name: 'smoking', in: 'query', schema: { type: 'boolean' } },
          { name: 'drinking', in: 'query', schema: { type: 'boolean' } },
          { name: 'pets', in: 'query', schema: { type: 'boolean' } },
          { name: 'sleepSchedule', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'List of requirements' } },
      },
      post: {
        tags: ['Requirements'], summary: 'Post a requirement', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RequirementInput' } } } },
        responses: { 201: { description: 'Requirement created' } },
      },
    },
    '/api/requirements/{id}': {
      get: {
        tags: ['Requirements'], summary: 'Get a requirement by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Requirement details' } },
      },
      put: {
        tags: ['Requirements'], summary: 'Update a requirement', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RequirementInput' } } } },
        responses: { 200: { description: 'Updated' } },
      },
      delete: {
        tags: ['Requirements'], summary: 'Delete a requirement', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },

    // ── MATCHING ──
    '/api/match/{userId}': {
      get: {
        tags: ['Matching'], summary: 'Get match scores with explanation',
        description: 'Weighted: Budget 30%, Location 25%, Lifestyle 25%, Interests 20%. Each match includes a score breakdown.',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Matches', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/MatchResult' } } } } } } },
        },
      },
    },

    // ── ENQUIRY / PAYMENT ──
    '/api/enquiry/order': {
      post: {
        tags: ['Enquiry'], summary: 'Create Razorpay order (₹19)',
        description: 'Pay ₹19 per unique listing to unlock chat access. If masked phone, owner gets email with your number.',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['listingType', 'listingId'], properties: { listingType: { type: 'string', enum: ['room', 'roommate', 'requirement'] }, listingId: { type: 'string' } } } } } },
        responses: { 201: { description: 'Order created' }, 400: { description: 'Already paid or own listing' } },
      },
    },
    '/api/enquiry/verify': {
      post: {
        tags: ['Enquiry'], summary: 'Verify Razorpay payment', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature'], properties: { razorpayOrderId: { type: 'string' }, razorpayPaymentId: { type: 'string' }, razorpaySignature: { type: 'string' } } } } } },
        responses: { 200: { description: 'Payment verified, chat unlocked' } },
      },
    },
    '/api/enquiry/mine': {
      get: { tags: ['Enquiry'], summary: 'Get my paid enquiries', security: [{ BearerAuth: [] }], responses: { 200: { description: 'List of enquiries' } } },
    },
    '/api/enquiry/access/{listingId}': {
      get: {
        tags: ['Enquiry'], summary: 'Check access to a listing', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'listingId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Access status' } },
      },
    },

    // ── CHAT ──
    '/api/chat/conversations': {
      get: { tags: ['Chat'], summary: 'Get all conversations', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Conversations list' } } },
    },
    '/api/chat/{conversationId}/messages': {
      get: {
        tags: ['Chat'], summary: 'Get messages in a conversation', security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { 200: { description: 'Messages' } },
      },
      post: {
        tags: ['Chat'], summary: 'Send message to existing conversation', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['text'], properties: { text: { type: 'string' } } } } } },
        responses: { 201: { description: 'Message sent' }, 402: { description: 'Payment required (enquiry chat)' } },
      },
    },
    '/api/chat/{conversationId}/read': {
      put: {
        tags: ['Chat'], summary: 'Mark messages as read', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'conversationId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Marked as read' } },
      },
    },

    // ── DIRECT MESSAGES ──
    '/api/messages': {
      post: {
        tags: ['Chat'], summary: 'Send direct message to any user',
        description: 'Creates a conversation if one does not exist between the two users.',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DirectMessageInput' } } } },
        responses: { 201: { description: 'Message sent, conversation returned' } },
      },
    },

    // ── TEAMS ──
    '/api/teams': {
      get: {
        tags: ['Teams'], summary: 'Browse teams',
        parameters: [
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'isOpen', in: 'query', schema: { type: 'boolean' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'List of teams' } },
      },
      post: {
        tags: ['Teams'], summary: 'Create a team', security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TeamInput' } } } },
        responses: { 201: { description: 'Team created' } },
      },
    },
    '/api/teams/{id}': {
      get: {
        tags: ['Teams'], summary: 'Get team details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Team details' } },
      },
      delete: {
        tags: ['Teams'], summary: 'Delete a team (creator only)', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
    '/api/teams/{id}/join': {
      post: {
        tags: ['Teams'], summary: 'Join a team', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Joined' }, 400: { description: 'Full or closed' } },
      },
    },
    '/api/teams/{id}/leave': {
      post: {
        tags: ['Teams'], summary: 'Leave a team', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Left team' } },
      },
    },

    // ── ROOMMATES (legacy) ──
    '/api/roommates': {
      get: { tags: ['Roommates'], summary: 'Browse roommate listings (legacy)', responses: { 200: { description: 'Listings' } } },
      post: {
        tags: ['Roommates'], summary: 'Post roommate listing (legacy)', security: [{ BearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
  },
};

const swaggerSpec = swaggerJsdoc({ swaggerDefinition, apis: [] });
module.exports = swaggerSpec;
