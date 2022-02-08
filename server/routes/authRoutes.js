const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authentication');

const {
   register,
   login,
   logout,
   verifyEmail,
} = require('../controllers/authController');

// '/api/v1/auth'
router.post('/register', register);
router.post('/login', login);
router.delete('/logout', authenticateUser, logout);
router.post('/verify-email', verifyEmail);

module.exports = router;
