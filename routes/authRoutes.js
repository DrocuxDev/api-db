// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rutas de autenticación
router.post('/registro', authController.registrar);
router.post('/register', authController.registrar);
router.post('/login', authController.login);

module.exports = router;
