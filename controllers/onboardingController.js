const asyncHandler = require('../utils/asyncHandler');
const onboardingService = require('../services/onboardingService');

/** PUT /api/onboarding/step1 */
const step1 = asyncHandler(async (req, res) => {
  const user = await onboardingService.completeStep1(req.user.id, req.body);
  res.status(200).json({ success: true, data: user });
});

/** PUT /api/onboarding/step2 */
const step2 = asyncHandler(async (req, res) => {
  const user = await onboardingService.completeStep2(req.user.id, req.body);
  res.status(200).json({ success: true, data: user });
});

/** PUT /api/onboarding/location */
const updateLocation = asyncHandler(async (req, res) => {
  const user = await onboardingService.updateLocation(req.user.id, req.body);
  res.status(200).json({ success: true, data: user });
});

module.exports = { step1, step2, updateLocation };
