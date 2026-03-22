/**
 * Seed script — populates DB with realistic demo data.
 * Run: node scripts/seed.js
 *
 * Creates:
 *   - 3 listers (flat-owner/pg-owner)
 *   - 5 enquirers (seekers)
 *   - 10 rooms, 6 PGs, 8 requirements
 *   - All wallets at 0 tokens
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const PG = require('../models/PG');
const Requirement = require('../models/Requirement');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Team = require('../models/Team');
const WalletTransaction = require('../models/WalletTransaction');
const UnlockedListing = require('../models/UnlockedListing');
const Enquiry = require('../models/Enquiry');
const Block = require('../models/Block');
const Wishlist = require('../models/Wishlist');

const MONGO_URI = process.env.MONGO_URI;

// ── 3 Listers ──
const listers = [
  {
    phone: '9876543210',
    name: 'Arjun Mehta',
    gender: 'male',
    city: 'Mumbai',
    userType: 'flat-owner',
    age: 28,
    occupation: 'Software Engineer',
    bio: 'Owns 3 properties in Mumbai. Looking for clean, responsible tenants.',
    verified: true,
    phoneVerified: true,
    onboardingComplete: true,
    walletBalance: 0,
    lifestyleTags: ['night-owl', 'fitness-freak', 'non-smoker', 'music-lover', 'foodie'],
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    preferences: {
      budgetMin: 8000, budgetMax: 25000, preferredLocation: 'Mumbai',
      lifestyle: { smoking: false, drinking: false, pets: false, sleepSchedule: 'night-owl' },
    },
  },
  {
    phone: '9876543211',
    name: 'Kavitha Reddy',
    gender: 'female',
    city: 'Bangalore',
    userType: 'pg-owner',
    age: 35,
    occupation: 'PG Owner',
    bio: 'Running PGs in Bangalore for 5 years. Homely food, safe environment.',
    verified: true,
    phoneVerified: true,
    onboardingComplete: true,
    walletBalance: 0,
    lifestyleTags: ['early-bird', 'spiritual', 'non-smoker', 'foodie', 'non-alcoholic'],
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    preferences: {
      budgetMin: 5000, budgetMax: 15000, preferredLocation: 'Bangalore',
      lifestyle: { smoking: false, drinking: false, pets: false, sleepSchedule: 'early-bird' },
    },
  },
  {
    phone: '9876543212',
    name: 'Rohit Kapoor',
    gender: 'male',
    city: 'Delhi',
    userType: 'flat-owner',
    age: 32,
    occupation: 'Real Estate Agent',
    bio: 'Managing flats in South Delhi and Noida. Premium properties only.',
    verified: true,
    phoneVerified: true,
    onboardingComplete: true,
    walletBalance: 0,
    lifestyleTags: ['fitness-freak', 'non-smoker', 'workaholic', 'sporty', 'foodie'],
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    preferences: {
      budgetMin: 10000, budgetMax: 30000, preferredLocation: 'Delhi',
      lifestyle: { smoking: false, drinking: true, pets: false, sleepSchedule: 'flexible' },
    },
  },
];

// ── 5 Enquirers/Seekers ──
const seekers = [
  {
    phone: '9123456789',
    name: 'Priya Sharma',
    gender: 'female',
    city: 'Bangalore',
    userType: 'seeker',
    age: 24,
    occupation: 'UX Designer',
    bio: 'Creative soul looking for a peaceful flatmate. Yoga and chai lover.',
    verified: true,
    phoneVerified: true,
    onboardingComplete: true,
    walletBalance: 0,
    lifestyleTags: ['early-bird', 'studious', 'vegan', 'non-alcoholic', 'spiritual'],
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    preferences: {
      budgetMin: 5000, budgetMax: 15000, preferredLocation: 'Bangalore',
      lifestyle: { smoking: false, drinking: false, pets: true, sleepSchedule: 'early-bird' },
    },
  },
  {
    phone: '9123456790',
    name: 'Rahul Verma',
    gender: 'male',
    city: 'Mumbai',
    userType: 'seeker',
    age: 26,
    occupation: 'Data Analyst',
    bio: 'Moving to Mumbai for a new job. Looking for a clean, furnished room.',
    verified: true,
    phoneVerified: true,
    onboardingComplete: true,
    walletBalance: 0,
    lifestyleTags: ['night-owl', 'gamer', 'fitness-freak', 'non-smoker', 'music-lover'],
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    preferences: {
      budgetMin: 8000, budgetMax: 18000, preferredLocation: 'Mumbai',
      lifestyle: { smoking: false, drinking: true, pets: false, sleepSchedule: 'night-owl' },
    },
  },
  {
    phone: '9123456791',
    name: 'Sneha Patel',
    gender: 'female',
    city: 'Bangalore',
    userType: 'seeker',
    age: 23,
    occupation: 'Software Developer',
    bio: 'Freshly graduated, joining a startup in Koramangala. Need affordable stay.',
    verified: true,
    phoneVerified: true,
    onboardingComplete: true,
    walletBalance: 0,
    lifestyleTags: ['studious', 'early-bird', 'non-smoker', 'pet-lover', 'foodie'],
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    preferences: {
      budgetMin: 6000, budgetMax: 12000, preferredLocation: 'Bangalore',
      lifestyle: { smoking: false, drinking: false, pets: true, sleepSchedule: 'early-bird' },
    },
  },
  {
    phone: '9123456792',
    name: 'Amit Singh',
    gender: 'male',
    city: 'Delhi',
    userType: 'seeker',
    age: 29,
    occupation: 'Marketing Manager',
    bio: 'Transferred to Delhi office. Need a flatmate who respects personal space.',
    verified: true,
    phoneVerified: true,
    onboardingComplete: true,
    walletBalance: 0,
    lifestyleTags: ['workaholic', 'fitness-freak', 'non-smoker', 'wanderer', 'music-lover'],
    profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    preferences: {
      budgetMin: 10000, budgetMax: 22000, preferredLocation: 'Delhi',
      lifestyle: { smoking: false, drinking: true, pets: false, sleepSchedule: 'flexible' },
    },
  },
  {
    phone: '9123456793',
    name: 'Nisha Gupta',
    gender: 'female',
    city: 'Mumbai',
    userType: 'seeker',
    age: 25,
    occupation: 'Content Writer',
    bio: 'Freelancer who needs a quiet space. Book lover and part-time baker.',
    verified: true,
    phoneVerified: true,
    onboardingComplete: true,
    walletBalance: 0,
    lifestyleTags: ['studious', 'non-smoker', 'non-alcoholic', 'foodie', 'spiritual'],
    profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
    preferences: {
      budgetMin: 7000, budgetMax: 16000, preferredLocation: 'Mumbai',
      lifestyle: { smoking: false, drinking: false, pets: false, sleepSchedule: 'early-bird' },
    },
  },
];

// ── Rooms (real Unsplash photos) ──
const rooms = [
  { title: 'Spacious 2BHK in Andheri West', description: 'Fully furnished with balcony, modular kitchen, 24/7 water. 5 min walk to metro.', location: 'Mumbai', rent: 18000, deposit: 36000, amenities: ['wifi', 'ac', 'washing-machine', 'parking', 'gym'], images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80'], availableFrom: new Date('2026-04-15'), preferredTenant: 'working-professionals', phoneVisibility: 'masked', contactPhone: '9876543210', ownerIdx: 0 },
  { title: 'Cozy Studio near Powai Lake', description: 'Perfect for solo professional. Furnished with bed, wardrobe, kitchen. Peaceful locality.', location: 'Mumbai', rent: 12000, deposit: 24000, amenities: ['wifi', 'furnished', 'power-backup'], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80'], availableFrom: new Date('2026-04-01'), preferredTenant: 'any', phoneVisibility: 'reveal', contactPhone: '9876543210', ownerIdx: 0 },
  { title: 'Modern 3BHK in Koramangala', description: 'Premium apartment, 3BR, 2BA, fully furnished. Close to tech parks & restaurants.', location: 'Bangalore', rent: 25000, deposit: 50000, amenities: ['wifi', 'ac', 'gym', 'swimming-pool', 'parking', 'security'], images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'], availableFrom: new Date('2026-05-01'), preferredTenant: 'any', phoneVisibility: 'masked', contactPhone: '9876543211', ownerIdx: 1 },
  { title: 'Budget Room in Indiranagar', description: 'Single room with attached bathroom. Includes bed, table. Shared kitchen available.', location: 'Bangalore', rent: 8000, deposit: 16000, amenities: ['wifi', 'furnished'], images: ['https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80', 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80'], availableFrom: new Date('2026-04-10'), preferredTenant: 'students', phoneVisibility: 'reveal', contactPhone: '9876543211', ownerIdx: 1 },
  { title: 'Sharing Room in HSR Layout', description: 'Looking for one flatmate to share 2BHK. Currently one person. Vegetarian preferred.', location: 'Bangalore', rent: 7000, deposit: 14000, amenities: ['wifi', 'washing-machine', 'power-backup'], images: ['https://images.unsplash.com/photo-1598928506311-c55ez37a8c8f?w=800&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80'], availableFrom: new Date('2026-04-20'), preferredTenant: 'male', phoneVisibility: 'masked', contactPhone: '9876543211', ownerIdx: 1 },
  { title: 'Premium Studio Bandra Sea-face', description: 'Sea-facing studio with kitchenette, AC, gym access. Walking distance to Bandra station.', location: 'Mumbai', rent: 22000, deposit: 44000, amenities: ['ac', 'gym', 'security', 'parking', 'furnished'], images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'], availableFrom: new Date('2026-05-15'), preferredTenant: 'working-professionals', phoneVisibility: 'masked', contactPhone: '9876543210', ownerIdx: 0 },
  { title: 'Sunny 1BHK in South Delhi', description: 'Airy 1BHK near Hauz Khas metro. Fully furnished with wooden flooring.', location: 'Delhi', rent: 20000, deposit: 40000, amenities: ['wifi', 'ac', 'furnished', 'parking'], images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'], availableFrom: new Date('2026-04-20'), preferredTenant: 'working-professionals', phoneVisibility: 'masked', contactPhone: '9876543212', ownerIdx: 2 },
  { title: 'Shared Flat in Noida Sec 62', description: '3BHK shared flat near IT companies. Two rooms available. Clean and well-maintained.', location: 'Delhi', rent: 9000, deposit: 18000, amenities: ['wifi', 'power-backup', 'washing-machine'], images: ['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80'], availableFrom: new Date('2026-04-05'), preferredTenant: 'any', phoneVisibility: 'reveal', contactPhone: '9876543212', ownerIdx: 2 },
  { title: 'Luxury Penthouse Juhu', description: 'Premium penthouse with terrace garden, 3 bedrooms, sea view. Fully loaded amenities.', location: 'Mumbai', rent: 45000, deposit: 90000, amenities: ['wifi', 'ac', 'gym', 'swimming-pool', 'parking', 'security', 'furnished'], images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80'], availableFrom: new Date('2026-06-01'), preferredTenant: 'family', phoneVisibility: 'masked', contactPhone: '9876543210', ownerIdx: 0 },
  { title: 'PG-style Room in Saket', description: 'Affordable single room in Saket. Metro accessible. Basic furnishing included.', location: 'Delhi', rent: 7500, deposit: 15000, amenities: ['wifi', 'furnished'], images: ['https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'], availableFrom: new Date('2026-04-10'), preferredTenant: 'students', phoneVisibility: 'masked', contactPhone: '9876543212', ownerIdx: 2 },
];

// ── PGs ──
const pgs = [
  { title: 'Boys PG in Andheri East', description: 'Clean PG with home-cooked meals, AC rooms, WiFi, laundry. Near station.', location: 'Mumbai', city: 'Mumbai', rent: 9000, deposit: 9000, gender: 'male', sharing: 'double', meals: true, amenities: ['wifi', 'ac', 'laundry', 'meals'], images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'], availableFrom: new Date('2026-04-01'), phoneVisibility: 'masked', contactPhone: '9876543210', ownerIdx: 0 },
  { title: 'Girls PG near MG Road', description: 'Safe PG for working women. CCTV, biometric entry, home food. Near MG Road metro.', location: 'Bangalore', city: 'Bangalore', rent: 8500, deposit: 8500, gender: 'female', sharing: 'triple', meals: true, amenities: ['wifi', 'meals', 'security', 'laundry'], images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'], availableFrom: new Date('2026-04-05'), phoneVisibility: 'masked', contactPhone: '9876543211', ownerIdx: 1 },
  { title: 'Unisex PG in Whitefield', description: 'Co-living space with modern amenities. Common area, kitchen, rooftop. Near ITPL.', location: 'Bangalore', city: 'Bangalore', rent: 11000, deposit: 11000, gender: 'unisex', sharing: 'single', meals: false, amenities: ['wifi', 'ac', 'gym', 'power-backup'], images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80', 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800&q=80'], availableFrom: new Date('2026-04-15'), phoneVisibility: 'reveal', contactPhone: '9876543211', ownerIdx: 1 },
  { title: 'Budget PG Vashi', description: 'Affordable PG with basic amenities. Non-AC triple room. Near Vashi railway station.', location: 'Mumbai', city: 'Mumbai', rent: 5500, deposit: 5500, gender: 'male', sharing: 'triple', meals: true, amenities: ['wifi', 'meals'], images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80', 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&q=80'], availableFrom: new Date('2026-04-01'), phoneVisibility: 'masked', contactPhone: '9876543210', ownerIdx: 0 },
  { title: 'Premium Girls PG South Delhi', description: 'AC rooms, attached bath, meals, laundry. 24/7 security. Near metro.', location: 'Delhi', city: 'Delhi', rent: 12000, deposit: 12000, gender: 'female', sharing: 'double', meals: true, amenities: ['wifi', 'ac', 'meals', 'security', 'laundry'], images: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'], availableFrom: new Date('2026-04-10'), phoneVisibility: 'masked', contactPhone: '9876543212', ownerIdx: 2 },
  { title: 'Boys PG in Electronic City', description: 'Tech park proximity. AC double sharing with meals. Gym and common area.', location: 'Bangalore', city: 'Bangalore', rent: 7500, deposit: 7500, gender: 'male', sharing: 'double', meals: true, amenities: ['wifi', 'ac', 'meals', 'gym'], images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', 'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80'], availableFrom: new Date('2026-04-20'), phoneVisibility: 'masked', contactPhone: '9876543211', ownerIdx: 1 },
];

// ── Requirements (posted by seekers) ──
const reqs = [
  { type: 'room', title: 'Looking for 1BHK in Koramangala', description: 'Vegetarian female looking for quiet 1BHK or sharing. Budget flexible.', budget: { min: 8000, max: 15000 }, location: 'Bangalore', moveInDate: new Date('2026-04-15'), preferredRoommate: { gender: 'female', ageMin: 22, ageMax: 30 }, lifestyle: { smoking: false, drinking: false, pets: true, sleepSchedule: 'early-bird' }, notes: 'Prefer vegetarian household.', phoneVisibility: 'masked', contactPhone: '9123456789', seekerIdx: 0 },
  { type: 'flatmate', title: 'Need flatmate for 2BHK in HSR', description: 'Have a 2BHK, one room vacant. Looking for clean working professional female.', budget: { min: 7000, max: 10000 }, location: 'Bangalore', moveInDate: new Date('2026-05-01'), preferredRoommate: { gender: 'female', ageMin: 23, ageMax: 32 }, lifestyle: { smoking: false, drinking: false, pets: false, sleepSchedule: 'flexible' }, notes: 'Non-smoker preferred.', phoneVisibility: 'reveal', contactPhone: '9123456791', seekerIdx: 2 },
  { type: 'room', title: 'Male professional seeking room in Andheri', description: 'IT professional moving to Mumbai. Need furnished room near Andheri or Goregaon.', budget: { min: 10000, max: 18000 }, location: 'Mumbai', moveInDate: new Date('2026-04-20'), preferredRoommate: { gender: 'male', ageMin: 24, ageMax: 35 }, lifestyle: { smoking: false, drinking: true, pets: false, sleepSchedule: 'night-owl' }, notes: 'Open to sharing. Gym nearby would be great.', phoneVisibility: 'masked', contactPhone: '9123456790', seekerIdx: 1 },
  { type: 'flatmate', title: 'Looking for chill flatmate in Bandra', description: 'Have a sea-facing flat. One room available. Music and cooking lovers welcome.', budget: { min: 12000, max: 20000 }, location: 'Mumbai', moveInDate: new Date('2026-05-10'), preferredRoommate: { gender: 'any', ageMin: 22, ageMax: 35 }, lifestyle: { smoking: false, drinking: true, pets: true, sleepSchedule: 'night-owl' }, notes: 'Must love dogs. I have a golden retriever.', phoneVisibility: 'reveal', contactPhone: '9123456793', seekerIdx: 4 },
  { type: 'room', title: 'Need PG or room near Cyber City Delhi', description: 'Marketing professional transferred to Gurgaon. Budget up to 15k.', budget: { min: 8000, max: 15000 }, location: 'Delhi', moveInDate: new Date('2026-04-25'), preferredRoommate: { gender: 'male', ageMin: 25, ageMax: 35 }, lifestyle: { smoking: false, drinking: true, pets: false, sleepSchedule: 'flexible' }, notes: 'Prefer single room.', phoneVisibility: 'masked', contactPhone: '9123456792', seekerIdx: 3 },
  { type: 'flatmate', title: 'Female flatmate needed in Jayanagar', description: 'Looking for a responsible female flatmate to share 2BHK in Jayanagar 4th Block.', budget: { min: 6000, max: 10000 }, location: 'Bangalore', moveInDate: new Date('2026-05-01'), preferredRoommate: { gender: 'female', ageMin: 21, ageMax: 28 }, lifestyle: { smoking: false, drinking: false, pets: false, sleepSchedule: 'early-bird' }, notes: 'Software developer. WFH mostly.', phoneVisibility: 'masked', contactPhone: '9123456791', seekerIdx: 2 },
  { type: 'room', title: 'Freelancer needs quiet room in Powai', description: 'Content writer working from home. Need a quiet, well-lit room with good WiFi.', budget: { min: 9000, max: 16000 }, location: 'Mumbai', moveInDate: new Date('2026-04-15'), preferredRoommate: { gender: 'female', ageMin: 22, ageMax: 30 }, lifestyle: { smoking: false, drinking: false, pets: false, sleepSchedule: 'early-bird' }, notes: 'Work from home, need silence during day.', phoneVisibility: 'masked', contactPhone: '9123456793', seekerIdx: 4 },
  { type: 'flatmate', title: 'Gamer bro needs flatmate in Andheri', description: 'Have a 2BHK. Looking for someone who is chill, plays games, and keeps the place clean.', budget: { min: 10000, max: 15000 }, location: 'Mumbai', moveInDate: new Date('2026-05-15'), preferredRoommate: { gender: 'male', ageMin: 23, ageMax: 30 }, lifestyle: { smoking: false, drinking: true, pets: false, sleepSchedule: 'night-owl' }, notes: 'PS5 included. 144Hz monitor in living room.', phoneVisibility: 'reveal', contactPhone: '9123456790', seekerIdx: 1 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear ALL collections
    const collections = [User, Room, PG, Requirement, Conversation, Message, Notification, Team, WalletTransaction, UnlockedListing, Enquiry, Block, Wishlist];
    for (const Model of collections) {
      await Model.deleteMany({});
    }
    console.log('Cleared all data');

    // Create users
    const createdListers = await User.insertMany(listers);
    const createdSeekers = await User.insertMany(seekers);
    console.log(`Created ${createdListers.length} listers + ${createdSeekers.length} seekers`);

    // Create rooms
    const roomDocs = rooms.map((r) => {
      const { ownerIdx, ...rest } = r;
      return { ...rest, postedBy: createdListers[ownerIdx]._id };
    });
    const createdRooms = await Room.insertMany(roomDocs);
    console.log(`Created ${createdRooms.length} rooms`);

    // Create PGs
    const pgDocs = pgs.map((p) => {
      const { ownerIdx, ...rest } = p;
      return { ...rest, postedBy: createdListers[ownerIdx]._id };
    });
    const createdPGs = await PG.insertMany(pgDocs);
    console.log(`Created ${createdPGs.length} PGs`);

    // Create requirements
    const reqDocs = reqs.map((r) => {
      const { seekerIdx, ...rest } = r;
      return { ...rest, createdBy: createdSeekers[seekerIdx]._id };
    });
    const createdReqs = await Requirement.insertMany(reqDocs);
    console.log(`Created ${createdReqs.length} requirements`);

    console.log('\n--- SEED COMPLETE ---');
    console.log('\nListers (property owners):');
    createdListers.forEach((u) => console.log(`  ${u.name.padEnd(18)} | ${u.phone} | ${u.city} | OTP: 123456`));
    console.log('\nSeekers (enquirers):');
    createdSeekers.forEach((u) => console.log(`  ${u.name.padEnd(18)} | ${u.phone} | ${u.city} | OTP: 123456`));
    console.log('\nAll wallets: 0 tokens');
    console.log('Recharge: 19 INR = 20 tokens');
    console.log('Unlock listing: 19 tokens\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
