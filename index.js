const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/db');
require('dotenv').config();

// Importar Modelos para que Sequelize los registre
const Producto = require('./models/producto');
const Usuario = require('./models/Usuario');
require('./models');

const app = express();

// (Conserva los imports y configuraciones previas)
const authRoutes = require('./routes/authRoutes');
const autenticar = require('./middleware/authMiddleware');

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
    max: 100, // Máximo 100 peticiones por IP en ese lapso
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

// Gestión de usuarios (crear, editar, eliminar): solo Administrador.
// La lectura queda abierta a usuarios autenticados porque el Kardex lista responsables.
app.use(['/usuarios', '/api/usuarios'], (req, res, next) => (req.method === 'GET' ? next() : autenticar(['Administrador'])(req, res, next)));

// --- SINCRONIZACIÓN Y ARRANQUE ---
const PORT = process.env.PORT || 3006;

// --- RUTAS CRUD PARA PRODUCTOS ---
// --- EJEMPLO DE RUTA PROTEGIDA ---
// Solo administradores o almaceneros pueden ver la lista

// 1. POST: Crear un nuevo producto (Hace funcionar el botón Guardar)
app.post(['/productos', '/api/productos'], autenticar(['Administrador', 'Almacenero']), async (req, res) => {
    try {
        const nuevoProducto = await Producto.create(req.body);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GET: Obtener todos los productos (Hace funcionar la Lista de Productos)
app.get(['/productos', '/api/productos'], autenticar(['Administrador', 'Almacenero']), async (req, res) => {
    try {
        const productos = await Producto.findAll();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. PUT: Actualizar un producto existente (Hace funcionar el botón Editar)
app.put(['/productos/:id', '/api/productos/:id'], autenticar(['Administrador', 'Almacenero']), async (req, res) => {
    try {
        await Producto.update(req.body, {
            where: { id: req.params.id }
        });
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. DELETE: Eliminar un producto (Hace funcionar el botón Eliminar)
app.delete(['/productos/:id', '/api/productos/:id'], autenticar(['Administrador', 'Almacenero']), async (req, res) => {
    try {
        await Producto.destroy({
            where: { id: req.params.id }
        });
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rutas previas adicionales del sistema (Kardex, Categorías, Proveedores, Dashboard)
app.use(require('./app'));

// force: false evita que se borren los datos cada vez que se reinicia el servidor
sequelize.sync({ force: false })
    .then(() => {
        console.log('Base de datos conectada y sincronizada.');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Error al conectar con la base de datos:', error);
    });
