const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../../../../shared');
const { authenticate } = auth;

// POST /api/v1/auth/ or /register  → register
router.post('/', authController.register);
router.post('/register', authController.register);

// POST /api/v1/auth/login   → login
router.post('/login', authController.login);

// GET  /api/v1/auth/me      → get current user (requires JWT)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
