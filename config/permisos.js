// config/permisos.js
// Catálogo de módulos y permisos por tipo de usuario (rol).
const Rol = require('../models/Rol');

const ADMIN = 'Administrador';

// Módulos del sistema (deben coincidir con los del frontend)
const MODULOS = ['dashboard', 'productos', 'categorias', 'proveedores', 'kardex', 'usuarios'];

// Permisos iniciales: se crean solo si el rol todavía no existe en la base de datos
const ROLES_BASE = {
    [ADMIN]: MODULOS,
    Almacenero: ['dashboard', 'productos', 'categorias', 'proveedores', 'kardex'],
    Supervisor: ['dashboard', 'kardex']
};

// Deja solo módulos válidos, sin duplicados y en orden
const normalizar = (lista) => MODULOS.filter((m) => Array.isArray(lista) && lista.includes(m));

// El Administrador siempre tiene todos los módulos (evita quedarse sin acceso)
async function obtenerModulos(nombreRol) {
    if (nombreRol === ADMIN) return [...MODULOS];
    if (!nombreRol) return [];
    const rol = await Rol.findOne({ where: { nombre: nombreRol } });
    return rol ? normalizar(rol.modulos) : [];
}

async function asegurarRolesBase() {
    for (const [nombre, modulos] of Object.entries(ROLES_BASE)) {
        await Rol.findOrCreate({ where: { nombre }, defaults: { nombre, modulos } });
    }
}

module.exports = { ADMIN, MODULOS, normalizar, obtenerModulos, asegurarRolesBase };
