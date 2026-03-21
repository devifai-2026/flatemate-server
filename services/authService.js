const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Register a new user and return a JWT.
 */
const register = async ({ name, email, password, age, gender, occupation }) => {
  const exists = await User.findOne({ email });
  if (exists) throw new AppError('Email already registered', 400);

  const user = await User.create({ name, email, password, age, gender, occupation });

  const token = generateToken(user);
  return { user: sanitizeUser(user), token };
};

/**
 * Authenticate user by email/password and return a JWT.
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const token = generateToken(user);
  return { user: sanitizeUser(user), token };
};

// ── Helpers ──

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, verified: user.verified },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
}

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

module.exports = { register, login };
