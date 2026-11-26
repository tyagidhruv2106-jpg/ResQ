const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationsController');

let authenticate, authorize;
try {
  const auth = require('../../../../shared/middleware/auth');
  authenticate = auth.authenticate;
  authorize = auth.authorize;
} catch (e) {
  authenticate = (req, res, next) => { next(); };
  authorize = (...roles) => (req, res, next) => { next(); };
}

// GET /api/v1/notifications
router.get('/', authenticate, controller.getNotifications);

// PATCH /api/v1/notifications/read-all — must be before /:id/read
router.patch('/read-all', authenticate, controller.markAllAsRead);

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', controller.markAsRead);

module.exports = router;
