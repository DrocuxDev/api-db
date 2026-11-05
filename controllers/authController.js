// controllers/authController.js
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registrar = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        // Verificar si el correo ya está en uso
        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ error: 'El correo ya se encuentra registrado' });
        }
        // El registro público no permite elegir rol: el primer usuario del sistema
        // será Administrador y los siguientes, Almacenero. Los demás roles los asigna
        // un Administrador desde /api/usuarios.
        const rol = (await Usuario.count()) === 0 ? 'Administrador' : 'Almacenero';
        const nuevoUsuario = await Usuario.create({ nombre, email, password, rol });
        res.status(201).json({ message: 'Usuario registrado exitosamente', id: nuevoUsuario.id, rol });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }
        // Buscar al usuario (unscoped: incluye el hash de la contraseña)
        const usuario = await Usuario.unscoped().findOne({ where: { email } });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Validar contraseña
        const passwordCorrecto = await bcrypt.compare(String(password ?? ''), usuario.password);
        if (!passwordCorrecto) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Un usuario inactivo no puede iniciar sesión
        if (!usuario.estado) {
            return res.status(403).json({ error: 'El usuario está inactivo.' });
        }
        // Generar JWT
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );
        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
