// models/Rol.js
// Tipos de usuario y módulos del sistema a los que tiene acceso cada uno.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Rol = sequelize.define('Rol', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    // Lista de módulos guardada como JSON (ej. ["dashboard","kardex"])
    modulos: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            try {
                const valor = JSON.parse(this.getDataValue('modulos') || '[]');
                return Array.isArray(valor) ? valor : [];
            } catch {
                return [];
            }
        },
        set(valor) {
            this.setDataValue('modulos', JSON.stringify(Array.isArray(valor) ? valor : []));
        }
    }
}, {
    tableName: 'roles',
    timestamps: true
});

module.exports = Rol;
