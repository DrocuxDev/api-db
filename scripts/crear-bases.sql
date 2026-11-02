-- Ejecutar con un administrador MySQL. Sustituye los ejemplos antes de ejecutar.
CREATE DATABASE IF NOT EXISTS inventario CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS inventario_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'inventario_app'@'localhost' IDENTIFIED BY 'CAMBIAR_CONTRASENA';
GRANT ALL PRIVILEGES ON inventario.* TO 'inventario_app'@'localhost';
GRANT ALL PRIVILEGES ON inventario_test.* TO 'inventario_app'@'localhost';
