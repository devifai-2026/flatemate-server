const Joi = require('joi');

const phonePattern = /^\+?[1-9]\d{6,14}$/;

// ── Auth ──

const registerSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().pattern(phonePattern),
  age: Joi.number().integer().min(18).max(120),
  gender: Joi.string().valid('male', 'female', 'non-binary', 'other'),
  occupation: Joi.string().max(100),
  bio: Joi.string().max(500),
  profileImage: Joi.string().uri(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

// ── OTP ──

const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .required()
    .messages({ 'any.required': 'Phone number is required' }),
});

const verifyOtpSchema = Joi.object({
  phone: Joi.string().required(),
  otp: Joi.string().length(4).required()
    .messages({ 'string.length': 'OTP must be 4 digits' }),
});

// ── Preferences ──

const preferencesSchema = Joi.object({
  budgetMin: Joi.number().min(0),
  budgetMax: Joi.number().min(0),
  preferredLocation: Joi.string(),
  lifestyle: Joi.object({
    smoking: Joi.boolean(),
    drinking: Joi.boolean(),
    pets: Joi.boolean(),
    sleepSchedule: Joi.string().valid('early-bird', 'night-owl', 'flexible'),
  }),
  interests: Joi.array().items(Joi.string()),
  roommatePreferences: Joi.object({
    ageMin: Joi.number().integer().min(18),
    ageMax: Joi.number().integer().max(120),
    gender: Joi.string().valid('male', 'female', 'non-binary', 'any'),
  }),
});

// ── Room ──

const roomSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000).required(),
  location: Joi.string().required(),
  rent: Joi.number().min(0).required(),
  deposit: Joi.number().min(0),
  amenities: Joi.array().items(Joi.string()),
  images: Joi.array().items(Joi.string().uri()).max(8),
  availableFrom: Joi.date().iso().required(),
  preferredTenant: Joi.string().valid('male', 'female', 'any', 'family', 'students', 'working-professionals'),
  phoneVisibility: Joi.string().valid('masked', 'reveal'),
  contactPhone: Joi.string().pattern(phonePattern),
});

const roomUpdateSchema = Joi.object({
  title: Joi.string().max(200),
  description: Joi.string().max(2000),
  location: Joi.string(),
  rent: Joi.number().min(0),
  deposit: Joi.number().min(0),
  amenities: Joi.array().items(Joi.string()),
  images: Joi.array().items(Joi.string().uri()).max(8),
  availableFrom: Joi.date().iso(),
  preferredTenant: Joi.string().valid('male', 'female', 'any', 'family', 'students', 'working-professionals'),
  phoneVisibility: Joi.string().valid('masked', 'reveal'),
  contactPhone: Joi.string().pattern(phonePattern),
}).min(1);

// ── Roommate Listing (legacy) ──

const roommateListingSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000),
  budget: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(0).required(),
  }).required(),
  preferredLocation: Joi.string().required(),
  lifestyle: Joi.object({
    smoking: Joi.boolean(),
    drinking: Joi.boolean(),
    pets: Joi.boolean(),
    sleepSchedule: Joi.string().valid('early-bird', 'night-owl', 'flexible'),
  }),
  moveInDate: Joi.date().iso(),
  phoneVisibility: Joi.string().valid('masked', 'reveal'),
  contactPhone: Joi.string().pattern(phonePattern),
});

// ── Requirement ──

const lifestyleJoi = Joi.object({
  smoking: Joi.boolean(),
  drinking: Joi.boolean(),
  pets: Joi.boolean(),
  sleepSchedule: Joi.string().valid('early-bird', 'night-owl', 'flexible'),
});

const preferredRoommateJoi = Joi.object({
  gender: Joi.string().valid('male', 'female', 'non-binary', 'any'),
  ageMin: Joi.number().integer().min(18),
  ageMax: Joi.number().integer().max(120),
  occupation: Joi.string().max(100),
});

const requirementSchema = Joi.object({
  type: Joi.string().valid('room', 'flatmate').required(),
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000),
  budget: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(0).required(),
  }).required(),
  location: Joi.string().required(),
  moveInDate: Joi.date().iso(),
  preferredRoommate: preferredRoommateJoi,
  lifestyle: lifestyleJoi,
  notes: Joi.string().max(1000),
  images: Joi.array().items(Joi.string().uri()).max(8),
  phoneVisibility: Joi.string().valid('masked', 'reveal'),
  contactPhone: Joi.string().pattern(phonePattern),
});

const requirementUpdateSchema = Joi.object({
  type: Joi.string().valid('room', 'flatmate'),
  title: Joi.string().max(200),
  description: Joi.string().max(2000),
  budget: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(0),
  }),
  location: Joi.string(),
  moveInDate: Joi.date().iso(),
  preferredRoommate: preferredRoommateJoi,
  lifestyle: lifestyleJoi,
  notes: Joi.string().max(1000),
  images: Joi.array().items(Joi.string().uri()).max(8),
  isActive: Joi.boolean(),
  phoneVisibility: Joi.string().valid('masked', 'reveal'),
  contactPhone: Joi.string().pattern(phonePattern),
}).min(1);

// ── Team ──

const teamSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().max(500),
  location: Joi.string().required(),
  budget: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(0),
  }),
  maxMembers: Joi.number().integer().min(2).max(10),
});

// ── Enquiry / Payment ──

const createEnquiryOrderSchema = Joi.object({
  listingType: Joi.string().valid('room', 'roommate', 'requirement').required(),
  listingId: Joi.string().required(),
});

const verifyPaymentSchema = Joi.object({
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
});

// ── Chat ──

const sendMessageSchema = Joi.object({
  text: Joi.string().max(5000).required(),
});

const directMessageSchema = Joi.object({
  receiverId: Joi.string().required(),
  text: Joi.string().max(5000).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyOtpSchema,
  preferencesSchema,
  roomSchema,
  roomUpdateSchema,
  roommateListingSchema,
  requirementSchema,
  requirementUpdateSchema,
  teamSchema,
  createEnquiryOrderSchema,
  verifyPaymentSchema,
  sendMessageSchema,
  directMessageSchema,
};
