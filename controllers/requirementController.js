const asyncHandler = require('../utils/asyncHandler');
const requirementService = require('../services/requirementService');

/** POST /api/requirements */
const createRequirement = asyncHandler(async (req, res) => {
  const requirement = await requirementService.create(req.body, req.user.id);
  const io = req.app.get('io');
  if (io) io.to('admin-room').emit('new-pending-listing', { type: 'requirement', listing: requirement });
  res.status(201).json({ success: true, data: requirement });
});

/** GET /api/requirements */
const getRequirements = asyncHandler(async (req, res) => {
  const result = await requirementService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

/** GET /api/requirements/:id */
const getRequirement = asyncHandler(async (req, res) => {
  const requirement = await requirementService.getById(req.params.id);
  res.status(200).json({ success: true, data: requirement });
});

/** PUT /api/requirements/:id */
const updateRequirement = asyncHandler(async (req, res) => {
  const requirement = await requirementService.update(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, data: requirement });
});

/** DELETE /api/requirements/:id */
const deleteRequirement = asyncHandler(async (req, res) => {
  await requirementService.remove(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: 'Requirement deleted' });
});

module.exports = { createRequirement, getRequirements, getRequirement, updateRequirement, deleteRequirement };
