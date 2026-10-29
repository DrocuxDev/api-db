const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
require('dotenv').config();

const {
    sequelize,
    Categoria,
    Proveedor,
    Usuario,
    Producto,
    Movimiento
} = require('./models');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- RUTA RAÍZ ---
app.get('/', (req, res) => {
    res.send('¡API Backend del Sistema de Inventario funcionando exitosamente!');
});

// ==========================================
// 1. ENDPOINTS PARA CATEGORÍAS
// ==========================================
const getCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.findAll({ order: [['id', 'ASC']] });
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createCategoria = async (req, res) => {
    try {
        const nueva = await Categoria.create(req.body);
        res.status(201).json(nueva);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateCategoria = async (req, res) => {
    try {
        const [updated] = await Categoria.update(req.body, { where: { id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'Categoría no encontrada' });
        const categoria = await Categoria.findByPk(req.params.id);
        res.json(categoria);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteCategoria = async (req, res) => {
    try {
        await Categoria.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Categoría eliminada' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

app.get(['/categorias', '/api/categorias'], getCategorias);
app.post(['/categorias', '/api/categorias'], createCategoria);
app.put(['/categorias/:id', '/api/categorias/:id'], updateCategoria);
app.delete(['/categorias/:id', '/api/categorias/:id'], deleteCategoria);

// ==========================================
// 2. ENDPOINTS PARA PROVEEDORES
// ==========================================
const getProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll({ order: [['id', 'ASC']] });
        res.json(proveedores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProveedor = async (req, res) => {
    try {
        const nuevo = await Proveedor.create(req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateProveedor = async (req, res) => {
    try {
        const [updated] = await Proveedor.update(req.body, { where: { id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'Proveedor no encontrado' });
        const proveedor = await Proveedor.findByPk(req.params.id);
        res.json(proveedor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteProveedor = async (req, res) => {
    try {
        await Proveedor.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Proveedor eliminado' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

app.get(['/proveedores', '/api/proveedores'], getProveedores);
app.post(['/proveedores', '/api/proveedores'], createProveedor);
app.put(['/proveedores/:id', '/api/proveedores/:id'], updateProveedor);
app.delete(['/proveedores/:id', '/api/proveedores/:id'], deleteProveedor);

// ==========================================
// 3. ENDPOINTS PARA USUARIOS
// ==========================================
const getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({ order: [['id', 'ASC']] });
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createUsuario = async (req, res) => {
    try {
        const nuevo = await Usuario.create(req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateUsuario = async (req, res) => {
    try {
        const [updated] = await Usuario.update(req.body, { where: { id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'Usuario no encontrado' });
        const usuario = await Usuario.findByPk(req.params.id);
        res.json(usuario);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteUsuario = async (req, res) => {
    try {
        await Usuario.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

app.get(['/usuarios', '/api/usuarios'], getUsuarios);
app.post(['/usuarios', '/api/usuarios'], createUsuario);
app.put(['/usuarios/:id', '/api/usuarios/:id'], updateUsuario);
app.delete(['/usuarios/:id', '/api/usuarios/:id'], deleteUsuario);

// ==========================================
// 4. ENDPOINTS PARA PRODUCTOS
// ==========================================
const getProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            include: [{ model: Categoria, attributes: ['id', 'nombre'] }],
            order: [['id', 'ASC']]
        });
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createProducto = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            categoria_id: req.body.categoria_id || null
        };
        const nuevoProducto = await Producto.create(payload);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateProducto = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            categoria_id: req.body.categoria_id || null
        };
        await Producto.update(payload, { where: { id: req.params.id } });
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteProducto = async (req, res) => {
    try {
        await Producto.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

app.get(['/productos', '/api/productos'], getProductos);
app.post(['/productos', '/api/productos'], createProducto);
app.put(['/productos/:id', '/api/productos/:id'], updateProducto);
app.delete(['/productos/:id', '/api/productos/:id'], deleteProducto);

// ==========================================
// 5. ENDPOINTS PARA MOVIMIENTOS (KARDEX CON TRANSACCIONES ACID)
// ==========================================
const getMovimientos = async (req, res) => {
    try {
        const movimientos = await Movimiento.findAll({
            include: [
                { model: Producto, attributes: ['id', 'nombre', 'stock'] },
                { model: Usuario, attributes: ['id', 'nombre', 'rol'] }
            ],
            order: [['fecha_hora', 'DESC'], ['id', 'DESC']]
        });
        res.json(movimientos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createMovimiento = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { producto_id, usuario_id, tipo_movimiento, cantidad, observaciones } = req.body;
        const cant = parseInt(cantidad, 10);

        if (!producto_id || !tipo_movimiento || isNaN(cant)) {
            await t.rollback();
            return res.status(400).json({ error: 'Datos incompletos o inválidos para el movimiento.' });
        }

        const producto = await Producto.findByPk(producto_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (!producto) {
            await t.rollback();
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        let nuevoStock = producto.stock;

        if (tipo_movimiento === 'Entrada') {
            if (cant <= 0) {
                await t.rollback();
                return res.status(400).json({ error: 'La cantidad de entrada debe ser mayor a 0.' });
            }
            nuevoStock += cant;
        } else if (tipo_movimiento === 'Salida') {
            if (cant <= 0) {
                await t.rollback();
                return res.status(400).json({ error: 'La cantidad de salida debe ser mayor a 0.' });
            }
            if (producto.stock < cant) {
                await t.rollback();
                return res.status(400).json({
                    error: `Stock insuficiente. Stock disponible: ${producto.stock}, solicitado: ${cant}.`
                });
            }
            nuevoStock -= cant;
        } else if (tipo_movimiento === 'Ajuste') {
            if (cant < 0) {
                await t.rollback();
                return res.status(400).json({ error: 'El stock de ajuste no puede ser negativo.' });
            }
            nuevoStock = cant;
        } else {
            await t.rollback();
            return res.status(400).json({ error: 'Tipo de movimiento no válido.' });
        }

        // 1. Registrar el movimiento en Kardex
        const nuevoMovimiento = await Movimiento.create({
            producto_id,
            usuario_id: usuario_id || null,
            tipo_movimiento,
            cantidad: cant,
            fecha_hora: new Date(),
            observaciones: observaciones || ''
        }, { transaction: t });

        // 2. Actualizar el stock del producto en simultáneo
        producto.stock = nuevoStock;
        await producto.save({ transaction: t });

        // 3. Confirmar transacción ACID
        await t.commit();

        const movimientoConRelaciones = await Movimiento.findByPk(nuevoMovimiento.id, {
            include: [
                { model: Producto, attributes: ['id', 'nombre', 'stock'] },
                { model: Usuario, attributes: ['id', 'nombre', 'rol'] }
            ]
        });

        res.status(201).json({
            message: 'Movimiento registrado y stock actualizado correctamente.',
            movimiento: movimientoConRelaciones,
            nuevoStock
        });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

app.get(['/movimientos', '/api/movimientos'], getMovimientos);
app.post(['/movimientos', '/api/movimientos'], createMovimiento);

// ==========================================
// 6. ENDPOINT PARA DASHBOARD / KPIs
// ==========================================
const getDashboardKpis = async (req, res) => {
    try {
        const [
            totalProductos,
            totalCategorias,
            totalProveedores,
            totalUsuarios,
            productosBajoStock,
            ultimosMovimientos
        ] = await Promise.all([
            Producto.count(),
            Categoria.count(),
            Proveedor.count(),
            Usuario.count(),
            Producto.findAll({
                where: { stock: { [Op.lt]: 10 } },
                include: [{ model: Categoria, attributes: ['id', 'nombre'] }],
                order: [['stock', 'ASC']]
            }),
            Movimiento.findAll({
                limit: 5,
                order: [['fecha_hora', 'DESC'], ['id', 'DESC']],
                include: [
                    { model: Producto, attributes: ['id', 'nombre', 'stock'] },
                    { model: Usuario, attributes: ['id', 'nombre', 'rol'] }
                ]
            })
        ]);

        res.json({
            totalProductos,
            totalCategorias,
            totalProveedores,
            totalUsuarios,
            alertasBajoStock: productosBajoStock.length,
            productosBajoStock,
            ultimosMovimientos
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

app.get(['/dashboard/kpis', '/api/dashboard/kpis'], getDashboardKpis);

// --- SINCRONIZACIÓN Y ARRANQUE ---
const PORT = process.env.PORT || 3006;

sequelize.sync({ alter: true })
    .then(async () => {
        console.log('Base de datos conectada y sincronizada.');

        // Crear datos semilla básicos si las tablas están vacías para facilitar pruebas
        const catCount = await Categoria.count();
        if (catCount === 0) {
            await Categoria.bulkCreate([
                { nombre: 'Electrónica', descripcion: 'Equipos electrónicos, cómputo y accesorios' },
                { nombre: 'Herramientas', descripcion: 'Herramientas manuales e industriales' },
                { nombre: 'Oficina', descripcion: 'Artículos y suministros de oficina' }
            ]);
        }

        const userCount = await Usuario.count();
        if (userCount === 0) {
            await Usuario.bulkCreate([
                { nombre: 'Admin Principal', email: 'admin@inventario.com', password: 'admin123', rol: 'Administrador', estado: true },
                { nombre: 'Carlos Almacén', email: 'almacen@inventario.com', password: 'almacen123', rol: 'Almacenero', estado: true }
            ]);
        }

        const provCount = await Proveedor.count();
        if (provCount === 0) {
            await Proveedor.bulkCreate([
                { razon_social: 'Tech Distribuidora SAC', contacto: 'Juan Pérez', telefono: '987654321', email: 'ventas@techdist.com' },
                { razon_social: 'Importaciones Globales EIRL', contacto: 'María Gómez', telefono: '912345678', email: 'contacto@impglobales.com' }
            ]);
        }

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Error al conectar con la base de datos:', error);
    });
