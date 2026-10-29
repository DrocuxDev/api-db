const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Movimiento = sequelize.define('Movimiento', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    producto_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    tipo_movimiento: {
        type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste'),
        allowNull: false
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fecha_hora: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    observaciones: {
        type: DataTypes.TEXT
    }
}, {
    tableName: 'Movimientos',
    timestamps: true
});

module.exports = Movimiento;
