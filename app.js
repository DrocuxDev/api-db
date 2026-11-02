const express = require('express');
const cors = require('cors');
const { Op, ValidationError, ForeignKeyConstraintError } = require('sequelize');
const { sequelize, Categoria, Proveedor, Usuario, Producto, Movimiento } = require('./models');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

class HttpError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}
const fail = (message, status = 400) => { throw new HttpError(status, message); };
const pick = (body, fields) => Object.fromEntries(fields.filter(k => body[k] !== undefined).map(k => [k, body[k]]));
const integer = (value, name, min = 0) => {
    const number = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') ? Number(value) : NaN;
    if (!Number.isInteger(number) || number < min || number > 2147483647) fail(`${name} debe ser un entero entre ${min} y 2147483647.`);
    return number;
};
const requiredText = (value, name) => {
    if (typeof value !== 'string' || !value.trim()) fail(`${name} es obligatorio.`);
    return value.trim();
};
const findRequired = async (model, id, name, options = {}) => {
    const row = await model.findByPk(integer(id, name, 1), options);
    if (!row) fail(`${name} no encontrado.`, 404);
    return row;
};
const productInclude = [{ model: Categoria, as: 'Categoria' }, { model: Proveedor }];
const movementInclude = [{ model: Producto, attributes: ['id', 'nombre', 'stock'] }, { model: Usuario, attributes: ['id', 'nombre', 'rol'] }];

app.get('/', (_req, res) => res.send('API de Inventario funcionando.'));
app.get('/api/health', async (_req, res) => {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'mysql' });
});

function crud(resource, model, fields, requiredField) {
    const paths = [`/${resource}`, `/api/${resource}`];
    const itemPaths = paths.map(p => `${p}/:id`);
    app.get(paths, async (_req, res) => res.json(await model.findAll({ order: [['id', 'ASC']] })));
    app.post(paths, async (req, res) => {
        const data = pick(req.body, fields);
        if (resource === 'proveedores' && data.email === '') data.email = null;
        data[requiredField] = requiredText(data[requiredField], requiredField);
        const row = await model.create(data);
        res.status(201).json(await model.findByPk(row.id));
    });
    app.put(itemPaths, async (req, res) => {
        const row = await findRequired(model, req.params.id, resource);
        const data = pick(req.body, fields);
        if (resource === 'proveedores' && data.email === '') data.email = null;
        if (requiredField in data) data[requiredField] = requiredText(data[requiredField], requiredField);
        await row.update(data);
        res.json(await model.findByPk(row.id));
    });
    app.delete(itemPaths, async (req, res) => {
        const row = await findRequired(model, req.params.id, resource);
        await row.destroy();
        res.json({ message: 'Registro eliminado.' });
    });
}
crud('categorias', Categoria, ['nombre', 'descripcion'], 'nombre');
crud('proveedores', Proveedor, ['razon_social', 'contacto', 'telefono', 'email'], 'razon_social');
crud('usuarios', Usuario, ['nombre', 'email', 'password', 'rol', 'estado'], 'nombre');

async function productData(body, transaction, partial = false) {
    const data = pick(body, ['nombre', 'descripcion', 'precio', 'categoria_id', 'proveedor_id']);
    if (!partial || 'nombre' in data) data.nombre = requiredText(data.nombre, 'Nombre');
    if (!partial || 'precio' in data) {
        if (data.precio === '' || data.precio == null || !Number.isFinite(Number(data.precio)) || Number(data.precio) < 0 || Number(data.precio) > 99999999.99) fail('Precio inválido.');
        data.precio = Number(data.precio);
    }
    for (const [key, model, label] of [['categoria_id', Categoria, 'Categoría'], ['proveedor_id', Proveedor, 'Proveedor']]) {
        if (!partial || key in data) {
            data[key] = integer(data[key], label, 1);
            await findRequired(model, data[key], label, { transaction });
        }
    }
    return data;
}

app.get(['/productos', '/api/productos'], async (_req, res) => {
    res.json(await Producto.findAll({ include: productInclude, order: [['id', 'ASC']] }));
});
app.post(['/productos', '/api/productos'], async (req, res) => {
    const stock = integer(req.body.stock ?? 0, 'Stock inicial');
    const id = await sequelize.transaction(async transaction => {
        const data = await productData(req.body, transaction);
        const producto = await Producto.create({ ...data, stock: 0 }, { transaction });
        if (stock > 0) {
            await Movimiento.create({ producto_id: producto.id, usuario_id: null, tipo_movimiento: 'Entrada', cantidad: stock, observaciones: 'Stock inicial al registrar el producto.' }, { transaction });
            await producto.update({ stock }, { transaction });
        }
        return producto.id;
    });
    res.status(201).json(await Producto.findByPk(id, { include: productInclude }));
});
app.put(['/productos/:id', '/api/productos/:id'], async (req, res) => {
    if (Object.hasOwn(req.body, 'stock')) fail('El stock solo puede modificarse mediante el Kardex.');
    const id = integer(req.params.id, 'Producto', 1);
    await sequelize.transaction(async transaction => {
        const producto = await findRequired(Producto, id, 'Producto', { transaction, lock: transaction.LOCK.UPDATE });
        await producto.update(await productData(req.body, transaction, true), { transaction });
    });
    res.json(await Producto.findByPk(id, { include: productInclude }));
});
app.delete(['/productos/:id', '/api/productos/:id'], async (req, res) => {
    await (await findRequired(Producto, req.params.id, 'Producto')).destroy();
    res.json({ message: 'Producto eliminado.' });
});

app.get(['/movimientos', '/api/movimientos'], async (_req, res) => {
    res.json(await Movimiento.findAll({ include: movementInclude, order: [['fecha_hora', 'DESC'], ['id', 'DESC']] }));
});
app.post(['/movimientos', '/api/movimientos'], async (req, res) => {
    const { tipo_movimiento, observaciones } = req.body;
    if (!['Entrada', 'Salida', 'Ajuste'].includes(tipo_movimiento)) fail('Tipo de movimiento no válido.');
    const cantidad = integer(req.body.cantidad, 'Cantidad', tipo_movimiento === 'Ajuste' ? 0 : 1);
    const result = await sequelize.transaction(async transaction => {
        const producto = await findRequired(Producto, req.body.producto_id, 'Producto', { transaction, lock: transaction.LOCK.UPDATE });
        let usuario_id = null;
        if (req.body.usuario_id != null && req.body.usuario_id !== '') {
            const usuario = await findRequired(Usuario, req.body.usuario_id, 'Usuario', { transaction });
            if (!usuario.estado) fail('El responsable está inactivo.');
            usuario_id = usuario.id;
        }
        const nuevoStock = tipo_movimiento === 'Entrada' ? producto.stock + cantidad : tipo_movimiento === 'Salida' ? producto.stock - cantidad : cantidad;
        if (nuevoStock < 0) fail(`Stock insuficiente. Disponible: ${producto.stock}.`, 409);
        integer(nuevoStock, 'Stock resultante');
        const movimiento = await Movimiento.create({ producto_id: producto.id, usuario_id, tipo_movimiento, cantidad, observaciones: observaciones || '' }, { transaction });
        await producto.update({ stock: nuevoStock }, { transaction });
        return { id: movimiento.id, nuevoStock };
    });
    const movimiento = await Movimiento.findByPk(result.id, { include: movementInclude });
    res.status(201).json({ message: 'Movimiento registrado y stock actualizado correctamente.', movimiento, nuevoStock: result.nuevoStock });
});

app.get(['/dashboard/kpis', '/api/dashboard/kpis'], async (_req, res) => {
    const [totalProductos, totalCategorias, totalProveedores, totalUsuarios, productosBajoStock, ultimosMovimientos, categorias, stocks] = await Promise.all([
        Producto.count(), Categoria.count(), Proveedor.count(), Usuario.count(),
        Producto.findAll({ where: { stock: { [Op.lt]: 10 } }, include: productInclude, order: [['stock', 'ASC']] }),
        Movimiento.findAll({ limit: 5, include: movementInclude, order: [['fecha_hora', 'DESC'], ['id', 'DESC']] }),
        Categoria.findAll({ attributes: ['id', 'nombre'], order: [['nombre', 'ASC']] }),
        Producto.findAll({ attributes: ['categoria_id', 'stock'], raw: true })
    ]);
    const stockPorCategoria = categorias.map(c => ({ nombre: c.nombre, unidades: stocks.filter(p => p.categoria_id === c.id).reduce((sum, p) => sum + p.stock, 0) }));
    res.json({ totalProductos, totalCategorias, totalProveedores, totalUsuarios, alertasBajoStock: productosBajoStock.length, productosBajoStock, ultimosMovimientos, stockPorCategoria });
});
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, _req, res, _next) => {
    if (error instanceof ForeignKeyConstraintError) return res.status(409).json({ error: 'Hay registros relacionados. No se puede eliminar o asignar esta referencia.' });
    if (error instanceof ValidationError) return res.status(400).json({ error: error.errors.length ? error.errors.map(e => e.message).join('; ') : error.message });
    if (error.status && error.status < 500) return res.status(error.status).json({ error: error.message });
    console.error('Error de API:', error.message);
    res.status(500).json({ error: 'No se pudo completar la operación. Revise la conexión con MySQL.' });
});
module.exports = app;
