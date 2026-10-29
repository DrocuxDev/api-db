const sequelize = require('../config/db');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Usuario = require('./Usuario');
const Producto = require('./Producto');
const Movimiento = require('./Movimiento');

// Relaciones en Sequelize
Categoria.hasMany(Producto, { foreignKey: 'categoria_id' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' });

Producto.hasMany(Movimiento, { foreignKey: 'producto_id' });
Movimiento.belongsTo(Producto, { foreignKey: 'producto_id' });

Usuario.hasMany(Movimiento, { foreignKey: 'usuario_id' });
Movimiento.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = {
    sequelize,
    Categoria,
    Proveedor,
    Usuario,
    Producto,
    Movimiento
};
