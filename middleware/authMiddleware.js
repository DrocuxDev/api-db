// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (rolesPermitidos = []) => {
    return (req, res, next) => {
        // Obtener el encabezado 'Authorization' (Bearer TOKEN)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Extrae el token de "Bearer <token>"

        // 401: no hay sesión (el frontend redirige al login)
        if (!token) {
            return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado.' });
        }
        let decodificado;
        try {
            // Verificar autenticidad y expiración
            decodificado = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Sesión inválida o expirada.' });
        }
        req.usuario = decodificado; // Adjunta la información del usuario a la petición

        // Validar si el rol es suficiente (RBAC - Control de acceso basado en roles)
        // 403: hay sesión, pero sin permisos (no se cierra la sesión)
        if (rolesPermitidos.length && !rolesPermitidos.includes(decodificado.rol)) {
            return res.status(403).json({ error: 'No autorizado: Permisos insuficientes.' });
        }
        next(); // Permite continuar con la ruta
    };
};
