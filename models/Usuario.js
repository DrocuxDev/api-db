const { scryptSync, randomBytes } = require('node:crypto');
const { DataTypes, ValidationError } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        set(value) {
            if (typeof value !== 'string' || value.length < 8) throw new ValidationError('La contraseña debe tener al menos 8 caracteres.');
            const salt = randomBytes(16).toString('hex');
            this.setDataValue('password', `scrypt:${salt}:${scryptSync(value, salt, 64).toString('hex')}`);
        }
    },
    rol: {
        type: DataTypes.ENUM('Administrador', 'Almacenero', 'Supervisor'),
        defaultValue: 'Almacenero'
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'Usuarios',
    defaultScope: { attributes: { exclude: ['password'] } },
    timestamps: true
});

module.exports = Usuario;
