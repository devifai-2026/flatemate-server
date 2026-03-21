const asyncHandler = require('../utils/asyncHandler');
const enquiryService = require('../services/enquiryService');

/** POST /api/enquiry/order — Create a Razorpay order for an enquiry */
const createOrder = asyncHandler(async (req, res) => {
  const { listingType, listingId } = req.body;
  const result = await enquiryService.createEnquiryOrder(req.user.id, listingType, listingId);
  res.status(201).json({ success: true, data: result });
});

/** POST /api/enquiry/verify — Verify Razorpay payment */
const verifyPayment = asyncHandler(async (req, res) => {
  const result = await enquiryService.verifyEnquiryPayment(req.user.id, req.body);
  res.status(200).json({ success: true, data: result });
});

/** GET /api/enquiry/mine — Get user's enquiries (connections) */
const getMyEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await enquiryService.getUserEnquiries(req.user.id);
  res.status(200).json({ success: true, data: enquiries });
});

/** GET /api/enquiry/access/:listingId — Check if user has paid access */
const checkAccess = asyncHandler(async (req, res) => {
  const hasAccess = await enquiryService.hasAccess(req.user.id, req.params.listingId);
  res.status(200).json({ success: true, data: { hasAccess } });
});

module.exports = { createOrder, verifyPayment, getMyEnquiries, checkAccess };
