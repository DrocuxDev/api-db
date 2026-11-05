// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const autenticar = require('../middleware/authMiddleware');

// Rutas de autenticación
router.post('/registro', authController.registrar);
router.post('/register', authController.registrar);
router.post('/login', authController.login);
// Módulos habilitados del usuario de la sesión (requiere token)
router.get('/permisos', autenticar(), authController.permisos);

module.exports = router;
