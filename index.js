require('dotenv').config({ quiet: true });
const app = require('./app');
const { sequelize, Categoria, Proveedor, Usuario } = require('./models');

async function start() {
    await sequelize.authenticate();
    await sequelize.sync();
    if (process.env.SEED_DEMO === 'true') {
        if (!await Categoria.count()) await Categoria.bulkCreate([
            { nombre: 'Electrónica', descripcion: 'Equipos y accesorios' },
            { nombre: 'Oficina', descripcion: 'Suministros de oficina' }
        ]);
        if (!await Proveedor.count()) await Proveedor.create({ razon_social: 'Proveedor de demostración', contacto: 'Área de ventas', email: 'ventas@example.com' });
        if (!await Usuario.count()) await Usuario.create({ nombre: 'Responsable de demostración', email: 'demo@example.com', password: 'CambiarDemo123!', rol: 'Almacenero', estado: true });
    }
    console.log('MySQL conectado. Cinco tablas sincronizadas.');
    const port = Number(process.env.PORT) || 3006;
    const server = app.listen(port, () => console.log(`API disponible en http://localhost:${port}`));
    const stop = () => server.close(() => sequelize.close().then(() => process.exit(0)));
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
}
start().catch(error => {
    console.error('No se pudo iniciar la API:', error.message);
    sequelize.close().finally(() => { process.exitCode = 1; });
});
