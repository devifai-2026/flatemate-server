const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const GuestActivity = require('../models/GuestActivity');

const router = Router();

// POST /api/guest/track — public, called by frontend to track guest activity
router.post('/track', asyncHandler(async (req, res) => {
  const { fingerprint, page, device, referrer, city, country } = req.body;

  if (!fingerprint || !page?.path) {
    return res.status(400).json({ success: false, message: 'fingerprint and page.path required' });
  }

  const guest = await GuestActivity.findOneAndUpdate(
    { fingerprint },
    {
      $set: {
        lastSeenAt: new Date(),
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.headers['x-forwarded-for'],
        ...(device && { device }),
        ...(referrer && { referrer }),
        ...(city && { city }),
        ...(country && { country }),
      },
      $setOnInsert: {
        fingerprint,
        firstSeenAt: new Date(),
      },
      $inc: { totalVisits: 1 },
      $push: {
        pages: {
          $each: [{ path: page.path, title: page.title, visitedAt: new Date(), duration: page.duration || 0 }],
          $slice: -100, // keep last 100 page visits per guest
        },
      },
    },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: { id: guest._id } });
}));

module.exports = router;
