// routes/rolesRoutes.js
// Tipos de usuario y los módulos habilitados para cada uno.
const express = require('express');
const Rol = require('../models/Rol');
const Usuario = require('../models/Usuario');
const { ADMIN, MODULOS, normalizar, asegurarRolesBase } = require('../config/permisos');
const { permitir, soloAdministrador } = require('../middleware/permisosMiddleware');

const router = express.Router();

const serializar = (rol) => ({
    id: rol.id,
    nombre: rol.nombre,
    modulos: rol.nombre === ADMIN ? [...MODULOS] : normalizar(rol.modulos),
    protegido: rol.nombre === ADMIN
});

const buscarRol = async (req, res) => {
    const id = Number(req.params.id);
    const rol = Number.isInteger(id) && id > 0 ? await Rol.findByPk(id) : null;
    if (!rol) res.status(404).json({ error: 'Rol no encontrado.' });
    return rol;
};

// Listado de roles (garantiza siempre los 3 roles base: Administrador, Almacenero, Supervisor)
router.get('/', permitir('usuarios'), async (_req, res) => {
    await asegurarRolesBase();
    const roles = await Rol.findAll({ order: [['id', 'ASC']] });
    res.json(roles.map(serializar));
});

// Crear un nuevo tipo de usuario
router.post('/', soloAdministrador, async (req, res) => {
    const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
    if (!nombre) return res.status(400).json({ error: 'El nombre del rol es obligatorio.' });
    if (nombre.length > 50) return res.status(400).json({ error: 'El nombre del rol admite como máximo 50 caracteres.' });
    if (await Rol.findOne({ where: { nombre } })) return res.status(409).json({ error: 'Ya existe un rol con ese nombre.' });
    const rol = await Rol.create({ nombre, modulos: normalizar(req.body.modulos) });
    res.status(201).json(serializar(rol));
});

// Actualizar los módulos habilitados de un rol
router.put('/:id', soloAdministrador, async (req, res) => {
    const rol = await buscarRol(req, res);
    if (!rol) return;
    if (rol.nombre === ADMIN) return res.status(400).json({ error: 'El Administrador siempre tiene acceso a todos los módulos.' });
    await rol.update({ modulos: normalizar(req.body?.modulos) });
    res.json(serializar(rol));
});

// Eliminar un rol que no tenga usuarios asignados
router.delete('/:id', soloAdministrador, async (req, res) => {
    const rol = await buscarRol(req, res);
    if (!rol) return;
    if (rol.nombre === ADMIN) return res.status(400).json({ error: 'El rol Administrador no se puede eliminar.' });
    const enUso = await Usuario.count({ where: { rol: rol.nombre } });
    if (enUso) return res.status(409).json({ error: `Hay ${enUso} usuario(s) con este rol. Reasígnalos antes de eliminarlo.` });
    await rol.destroy();
    res.json({ message: 'Rol eliminado.' });
});

module.exports = router;
