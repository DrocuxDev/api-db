const { Sequelize } = require('sequelize');
require('dotenv').config({ quiet: true });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false // Para no saturar la consola con consultas SQL
    }
);

module.exports = sequelize;
