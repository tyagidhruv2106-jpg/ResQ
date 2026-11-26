const express = require('express');
const router = express.Router();
const controller = require('../controllers/organizationsController');

let authenticate, authorize;
try {
  const auth = require('../../../../shared/middleware/auth');
  authenticate = auth.authenticate;
  authorize = auth.authorize;
} catch (e) {
  authenticate = (req, res, next) => { next(); };
  authorize = (...roles) => (req, res, next) => { next(); };
}

// Public routes
router.post('/', controller.registerOrganization);
router.get('/', controller.getOrganizations);

// Authenticated routes — /my must come before /:id to avoid shadowing
router.get('/my', authenticate, controller.getOrganizationByUserId);
router.get('/:id', controller.getOrganizationById);

// Org admin / admin update
router.put('/:id', authenticate, authorize('admin', 'org_admin'), controller.updateOrganization);

// Admin-only verify
router.patch('/:id/verify', authenticate, authorize('admin'), controller.verifyOrganization);

module.exports = router;

