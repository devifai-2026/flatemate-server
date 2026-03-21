const Razorpay = require('razorpay');
const crypto = require('crypto');
const Enquiry = require('../models/Enquiry');
const Room = require('../models/Room');
const RoommateListing = require('../models/RoommateListing');
const Requirement = require('../models/Requirement');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const AppError = require('../utils/AppError');
const { sendMaskedEnquiryNotification } = require('./emailService');

// Lazy-init Razorpay so the module loads even without env vars set
let _razorpay;
function getRazorpay() {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

const ENQUIRY_AMOUNT = Number(process.env.ENQUIRY_AMOUNT) || 1900; // 1900 paise = ₹19

/**
 * Step 1: Create a Razorpay order for an enquiry.
 * The user pays ₹19 per unique listing they want to connect with.
 */
const createEnquiryOrder = async (enquirerId, listingType, listingId) => {
  // Check if enquiry already exists and is paid
  const existing = await Enquiry.findOne({
    enquirer: enquirerId,
    listingId,
    paymentStatus: 'paid',
  });
  if (existing) {
    throw new AppError('You have already paid for this enquiry', 400);
  }

  // Find the listing and its owner
  const { listing, ownerId } = await getListingAndOwner(listingType, listingId);

  // Don't allow enquiry on own listing
  if (ownerId.toString() === enquirerId) {
    throw new AppError('Cannot enquire on your own listing', 400);
  }

  // Create Razorpay order
  const order = await getRazorpay().orders.create({
    amount: ENQUIRY_AMOUNT,
    currency: 'INR',
    receipt: `enq_${enquirerId}_${listingId}`,
    notes: { enquirerId, listingType, listingId: listingId.toString() },
  });

  // Create or update enquiry record
  await Enquiry.findOneAndUpdate(
    { enquirer: enquirerId, listingId },
    {
      enquirer: enquirerId,
      listingType,
      listingId,
      listingOwner: ownerId,
      amount: ENQUIRY_AMOUNT,
      razorpayOrderId: order.id,
      paymentStatus: 'pending',
    },
    { upsert: true, new: true }
  );

  return {
    orderId: order.id,
    amount: ENQUIRY_AMOUNT,
    currency: 'INR',
    listingTitle: listing.title,
  };
};

/**
 * Step 2: Verify Razorpay payment and activate the enquiry.
 * Once paid, the user can chat (Socket) with the listing owner.
 */
const verifyEnquiryPayment = async (enquirerId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  // Verify Razorpay signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new AppError('Payment verification failed — invalid signature', 400);
  }

  const enquiry = await Enquiry.findOne({
    razorpayOrderId,
    enquirer: enquirerId,
  });

  if (!enquiry) throw new AppError('Enquiry not found', 404);
  if (enquiry.paymentStatus === 'paid') {
    throw new AppError('Payment already verified', 400);
  }

  // Activate the enquiry
  enquiry.razorpayPaymentId = razorpayPaymentId;
  enquiry.razorpaySignature = razorpaySignature;
  enquiry.paymentStatus = 'paid';
  enquiry.canChat = true;
  await enquiry.save();

  // Create a conversation between the two users
  const conversation = await Conversation.findOneAndUpdate(
    {
      participants: { $all: [enquirerId, enquiry.listingOwner] },
      enquiry: enquiry._id,
    },
    {
      participants: [enquirerId, enquiry.listingOwner],
      enquiry: enquiry._id,
    },
    { upsert: true, new: true }
  );

  // If listing has masked phone, email the owner with the enquirer's phone
  await handleMaskedNotification(enquiry, enquirerId);

  return {
    message: 'Payment verified. You can now chat with the listing owner.',
    enquiryId: enquiry._id,
    conversationId: conversation._id,
  };
};

/**
 * Get all enquiries made by a user (their connections).
 */
const getUserEnquiries = async (userId) => {
  return Enquiry.find({ enquirer: userId, paymentStatus: 'paid' })
    .populate('listingOwner', 'name email phone')
    .sort({ createdAt: -1 });
};

/**
 * Check if a user has paid access to a specific listing.
 */
const hasAccess = async (enquirerId, listingId) => {
  const enquiry = await Enquiry.findOne({
    enquirer: enquirerId,
    listingId,
    paymentStatus: 'paid',
  });
  return !!enquiry;
};

// ── Helpers ──

async function getListingAndOwner(listingType, listingId) {
  let listing;
  let ownerId;

  if (listingType === 'room') {
    listing = await Room.findById(listingId);
    if (!listing) throw new AppError('Room listing not found', 404);
    ownerId = listing.postedBy;
  } else if (listingType === 'roommate') {
    listing = await RoommateListing.findById(listingId);
    if (!listing) throw new AppError('Roommate listing not found', 404);
    ownerId = listing.user;
  } else if (listingType === 'requirement') {
    listing = await Requirement.findById(listingId);
    if (!listing) throw new AppError('Requirement not found', 404);
    ownerId = listing.createdBy;
  } else {
    throw new AppError('Invalid listing type', 400);
  }

  return { listing, ownerId };
}

async function handleMaskedNotification(enquiry, enquirerId) {
  const listingType = enquiry.listingType;
  let listing;

  if (listingType === 'room') {
    listing = await Room.findById(enquiry.listingId);
  } else if (listingType === 'requirement') {
    listing = await Requirement.findById(enquiry.listingId);
  } else {
    listing = await RoommateListing.findById(enquiry.listingId);
  }

  if (listing?.phoneVisibility === 'masked') {
    const owner = await User.findById(enquiry.listingOwner);
    const enquirer = await User.findById(enquirerId);

    if (owner && enquirer) {
      await sendMaskedEnquiryNotification({
        ownerEmail: owner.email,
        ownerName: owner.name,
        enquirerName: enquirer.name,
        enquirerPhone: enquirer.phone || 'Not provided',
        listingTitle: listing.title,
      });
    }
  }
}

module.exports = {
  createEnquiryOrder,
  verifyEnquiryPayment,
  getUserEnquiries,
  hasAccess,
};
