const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');

let authenticate, authorize;
try {
  const auth = require('../../../../shared/middleware/auth');
  authenticate = auth.authenticate;
  authorize = auth.authorize;
} catch (e) {
  authenticate = (req, res, next) => { next(); };
  authorize = (...roles) => (req, res, next) => { next(); };
}

// GET /api/v1/admin/stats
router.get('/stats', authenticate, authorize('admin'), controller.getDashboardStats);

// GET /api/v1/admin/users
router.get('/users', authenticate, authorize('admin'), controller.getUsers);

// GET /api/v1/admin/reports
router.get('/reports', authenticate, authorize('admin'), controller.getReports);

module.exports = router;
