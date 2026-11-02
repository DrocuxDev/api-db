# API de Inventario - Laboratorio 9

Express 5 + Sequelize 6 + MySQL 8.4. Backend del frontend
[app-inventario](https://github.com/DrocuxDev/app-inventario).

## Arranque desde cero

1. Instala Node.js 22.12 o superior y MySQL 8.4. Crea una base vacía y un usuario
   con permisos sobre ella. `scripts/crear-bases.sql` sirve como ejemplo editable.
2. Copia `.env.example` a `.env` y sustituye las credenciales y el nombre de la base.
3. Ejecuta `npm ci` y `npm start`. Sequelize crea automáticamente las cinco tablas
   y cuatro claves foráneas en una base nueva.
4. Comprueba `http://localhost:3006/api/health`.
5. Con `SEED_DEMO=true` se crean categorías, proveedor y responsable de ejemplo.
   Opcionalmente ejecuta `npm run demo` con la API encendida para añadir dos productos.

Como alternativa a una instalación local de MySQL, `docker compose up -d` usa
`compose.yaml` y las variables de `.env`. Para pruebas, crea también la base
`TEST_DB_NAME` y concede acceso al mismo usuario.

## Base anterior

Esta versión añade proveedor obligatorio y categoría obligatoria. `sync()` crea
tablas nuevas; no modifica automáticamente tablas existentes. Para el laboratorio
usa una base nueva. Si necesitas conservar una base anterior, respáldala, asigna
categorías/proveedores a todos los productos y prepara una migración de columnas
NOT NULL y claves foráneas antes de utilizarla. No ejecutes las pruebas sobre ella.

## Reglas verificadas

- Productos requieren categoría y proveedor existentes.
- Stock inicial positivo: creación del producto y entrada inicial en una transacción.
- PUT de producto rechaza cualquier campo `stock`.
- Kardex: Entrada suma, Salida resta sin permitir negativos, Ajuste fija el total.
- Cantidades enteras; bloqueo de fila durante la transacción para evitar sobreventa.
- Eliminación de categorías/proveedores/productos con relaciones: HTTP 409.
- Contraseñas de usuarios almacenadas con scrypt y excluidas de las respuestas.
  El módulo de usuarios es administrativo; esta práctica no incluye login.

## Endpoints

`/api/categorias`, `/api/proveedores`, `/api/usuarios`, `/api/productos`:
GET y POST sobre la colección; PUT y DELETE sobre `/:id`.
`/api/movimientos`: GET y POST. `/api/dashboard/kpis`: GET. `/api/health`: GET.
Se conservan también las rutas antiguas sin el prefijo `/api`.

## Pruebas

Configura una base desechable `TEST_DB_NAME` terminada en `_test`. `npm test`
recrea exclusivamente sus tablas y ejecuta 14 grupos de verificaciones reales
contra MySQL, incluyendo concurrencia y ausencia de escrituras en rechazos.
Los resultados JSON se guardan en `test-results/integration.json`.

Importa `postman/inventario.postman_collection.json` en Postman. La variable
`base_url` apunta a `http://127.0.0.1:3006`. Incluye 12 solicitudes y 18 aserciones.
La colección crea datos de demostración; ejecútala solo en el laboratorio.

## Publicación del código

No publiques `.env`, `node_modules`, resultados de pruebas ni bases locales.
El repositorio original incluía `.env` y dependencias. Al actualizar ese checkout:

```powershell
git rm --cached --ignore-unmatch .env
git rm -r --cached --ignore-unmatch node_modules
git add .
git status
git commit -m "Completar relaciones y Kardex transaccional del laboratorio 9"
git push
```

Si las credenciales publicadas eran reales, cámbialas; eliminarlas del último
commit no las borra del historial. Las credenciales de la prueba local no forman
parte de esta entrega.
