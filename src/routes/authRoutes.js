const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rotas públicas
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authenticateToken, authController.me);
router.post('/register', authenticateToken, authController.register);

module.exports = router;

