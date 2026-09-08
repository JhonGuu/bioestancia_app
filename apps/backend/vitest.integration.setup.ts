/**
 * Corre ANTES de importar cualquier archivo de test de integración —
 * necesario porque `Env`/`DrizzleAdapter` leen `process.env` recién al
 * construirse (no al importarse), pero un `import` estático siempre se
 * evalúa antes que el código propio del archivo que lo escribe, sin
 * importar el orden en el que estén escritos ambos en el código fuente. Si
 * seteáramos estas variables arriba del mismo archivo de test, los módulos
 * importados (DI, DrizzleAdapter, etc.) ya se habrían cargado antes.
 *
 * `??=` para no pisar nada si el que corre esto ya las seteó a mano (ej.
 * para apuntar a otra base).
 */
process.env.NODE_ENV ??= "test";
process.env.PORT ??= "0";
process.env.JWT_SECRET ??= "test-jwt-secret-no-es-real-pero-cumple-el-largo-minimo";
process.env.BCRYPT_SALT ??= "4";
process.env.LOG_LEVEL ??= "silent";
process.env.DB_URL ??= "postgres://bioestancia:bioestancia@localhost:5432/bioestancia";
