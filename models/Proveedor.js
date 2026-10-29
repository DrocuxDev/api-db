const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Proveedor = sequelize.define('Proveedor', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    razon_social: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contacto: {
        type: DataTypes.STRING
    },
    telefono: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        validate: {
            isEmail: true
        }
    }
}, {
    tableName: 'Proveedores',
    timestamps: true
});

module.exports = Proveedor;
