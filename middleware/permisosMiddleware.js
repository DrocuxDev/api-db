// middleware/permisosMiddleware.js
// Control de acceso por módulos. Usa el rol ACTUAL del usuario en la base de datos
// (no el del token), así los cambios de rol o permisos se aplican sin volver a iniciar sesión.
const Usuario = require('../models/Usuario');
const { ADMIN, obtenerModulos } = require('../config/permisos');

async function cargarSesion(req) {
    if (req.sesion) return req.sesion;
    const usuario = req.usuario?.id ? await Usuario.findByPk(req.usuario.id) : null;
    if (!usuario || !usuario.estado) return null;
    req.sesion = {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        modulos: await obtenerModulos(usuario.rol)
    };
    return req.sesion;
}

// permitir('productos', { lectura: ['kardex'] }):
//   - acceso total con el módulo 'productos'
//   - solo lectura (GET) con el módulo 'kardex' (el Kardex necesita la lista de productos)
const permitir = (modulo, { lectura = [] } = {}) => async (req, res, next) => {
    const sesion = await cargarSesion(req);
    // 401: usuario eliminado o inactivo (el frontend cierra la sesión)
    if (!sesion) return res.status(401).json({ error: 'Sesión inválida o usuario inactivo.' });
    const puedeLeer = req.method === 'GET' && lectura.some((m) => sesion.modulos.includes(m));
    if (!sesion.modulos.includes(modulo) && !puedeLeer) {
        return res.status(403).json({ error: 'No tienes acceso a este módulo.' });
    }
    next();
};

const soloAdministrador = async (req, res, next) => {
    const sesion = await cargarSesion(req);
    if (!sesion) return res.status(401).json({ error: 'Sesión inválida o usuario inactivo.' });
    if (sesion.rol !== ADMIN) return res.status(403).json({ error: 'Solo un Administrador puede realizar esta acción.' });
    next();
};

module.exports = { cargarSesion, permitir, soloAdministrador };
