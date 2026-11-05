const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/db');
require('dotenv').config();

// Importar Modelos para que Sequelize los registre
const Usuario = require('./models/Usuario');
require('./models');

const app = express();

// (Conserva los imports y configuraciones previas)
const authRoutes = require('./routes/authRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const autenticar = require('./middleware/authMiddleware');
const { permitir } = require('./middleware/permisosMiddleware');
const { ADMIN, asegurarRolesBase } = require('./config/permisos');

// --- MIDDLEWARES ---
// --- PROTECCIÓN CONTRA ATAQUES COMUNES ---

// 1. HELMET: Protege contra XSS y otras vulnerabilidades de cabecera HTTP
app.use(helmet());

// 2. CORS: Configuración restrictiva (reemplazar por la URL de tu React cuando esté en producción)
// Por ahora permitimos localhost:5173 (Vite), lo cual previene peticiones de orígenes no autorizados.
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. RATE LIMIT: Previene ataques de Fuerza Bruta y DoS limitando las peticiones por IP
const limitador = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: Number(process.env.RATE_LIMIT_MAX) || 1000, // Máximo de peticiones por IP en ese lapso (React en desarrollo duplica peticiones)
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.'
});
app.use('/api/', limitador); // Aplica a todas las rutas que comiencen con /api/

// Parsear el body de las peticiones a JSON
app.use(express.json());

// Rutas de autenticación abiertas para todos
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// --- RUTAS BÁSICAS DE PRUEBA ---
app.get('/', (req, res) => {
    res.send('¡API Backend funcionando exitosamente!');
});

// --- PROTECCIÓN GLOBAL CON JWT ---
// A partir de aquí todas las rutas exigen un token válido, salvo las públicas.
const RUTAS_PUBLICAS = new Set(['/', '/api/health']);
app.use((req, res, next) => (RUTAS_PUBLICAS.has(req.path) ? next() : autenticar()(req, res, next)));

// --- CONTROL DE ACCESO POR MÓDULOS ---
// Cada rol tiene módulos habilitados (se configuran en Usuarios → Roles y módulos).
// "lectura" permite solo GET a quien tenga otro módulo que necesita esos datos.
app.use(['/dashboard', '/api/dashboard'], permitir('dashboard'));
app.use(['/productos', '/api/productos'], permitir('productos', { lectura: ['kardex'] }));
app.use(['/categorias', '/api/categorias'], permitir('categorias', { lectura: ['productos'] }));
app.use(['/proveedores', '/api/proveedores'], permitir('proveedores', { lectura: ['productos'] }));
app.use(['/movimientos', '/api/movimientos'], permitir('kardex'));

// Gestión de usuarios: módulo "usuarios". La lectura también se permite con el módulo
// "kardex" porque el Kardex lista responsables.
app.use(['/usuarios', '/api/usuarios'], permitir('usuarios', { lectura: ['kardex'] }), async (req, res, next) => {
    // Solo un Administrador puede crear, modificar o eliminar Administradores
    if (req.method === 'GET' || req.sesion.rol === ADMIN) return next();
    if (req.body?.rol === ADMIN) {
        return res.status(403).json({ error: 'Solo un Administrador puede asignar el rol Administrador.' });
    }
    const id = Number(req.path.split('/')[1]);
    if (id && (await Usuario.findByPk(id))?.rol === ADMIN) {
        return res.status(403).json({ error: 'Solo un Administrador puede modificar a otro Administrador.' });
    }
    next();
});

// Tipos de usuario (roles) y sus módulos habilitados
app.use(['/roles', '/api/roles'], rolesRoutes);

// --- SINCRONIZACIÓN Y ARRANQUE ---
const PORT = process.env.PORT || 3006;

// Rutas del sistema (Productos, Kardex, Categorías, Proveedores, Usuarios, Dashboard).
// La lógica CRUD de productos (incluye Categoría/Proveedor y registra la entrada
// inicial en el Kardex dentro de una transacción) está en app.js.
app.use(require('./app'));

// force: false evita que se borren los datos cada vez que se reinicia el servidor
sequelize.sync({ force: false })
    .then(() => asegurarRolesBase())
    .then(() => {
        console.log('Base de datos conectada y sincronizada.');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Error al conectar con la base de datos:', error);
    });
