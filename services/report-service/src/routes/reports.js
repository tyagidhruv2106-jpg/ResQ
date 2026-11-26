const express = require('express');
const router = express.Router();

const controller = require('../controllers/reportsController');
const assignments = require('../controllers/assignmentsController');
const { auth } = require('../../../../shared');
const { authenticate, authorize, optionalAuthenticate } = auth;

// ─── Specific static-path routes MUST come before /:id ─────────────────────

// GET /api/v1/reports/my — authenticated user's own submitted reports
router.get('/my', authenticate, controller.getMyReports);

// GET /api/v1/reports/available — open reports visible to org users
router.get('/available', authenticate, authorize('org_admin', 'rescuer', 'admin'), assignments.getAvailableReports);

// GET /api/v1/reports/assignments/mine — assignments for the requesting org
router.get('/assignments/mine', authenticate, assignments.getMyAssignments);

// ─── Standard CRUD ──────────────────────────────────────────────────────────

// POST /api/v1/reports
router.post('/', optionalAuthenticate, controller.createReport);

// GET /api/v1/reports
router.get('/', controller.getReports);

// ─── Parameterized routes (must come after all static paths) ────────────────

// GET /api/v1/reports/:id
router.get('/:id', controller.getReportById);

// POST /api/v1/reports/:id/accept — NGO accepts an open report
router.post('/:id/accept', authenticate, authorize('org_admin', 'rescuer', 'admin'), assignments.acceptReport);

// PUT /api/v1/reports/:id/status — advance report lifecycle status
router.put('/:id/status', authenticate, assignments.updateStatus);

// GET /api/v1/reports/:id/tracking — full tracking audit log
router.get('/:id/tracking', assignments.getTrackingHistory);

module.exports = router;
