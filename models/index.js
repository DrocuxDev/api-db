const sequelize = require('../config/db');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Usuario = require('./Usuario');
const Producto = require('./producto');
const Movimiento = require('./Movimiento');
const Rol = require('./Rol');

// Relaciones en Sequelize
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', onDelete: 'RESTRICT' });
Producto.belongsTo(Categoria, { as: 'Categoria', foreignKey: 'categoria_id', onDelete: 'RESTRICT' });

Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', onDelete: 'RESTRICT' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', onDelete: 'RESTRICT' });

Producto.hasMany(Movimiento, { foreignKey: 'producto_id', onDelete: 'RESTRICT' });
Movimiento.belongsTo(Producto, { foreignKey: 'producto_id', onDelete: 'RESTRICT' });

Usuario.hasMany(Movimiento, { foreignKey: 'usuario_id', onDelete: 'RESTRICT' });
Movimiento.belongsTo(Usuario, { foreignKey: 'usuario_id', onDelete: 'RESTRICT' });

module.exports = {
    sequelize,
    Categoria,
    Proveedor,
    Usuario,
    Producto,
    Movimiento,
    Rol
};
