'use strict';

const crypto = require('crypto');
const path = require('path');

// Valores por defecto acordados como propuesta (PR8 y PR9). Se sobrescriben con variables de entorno.
const PUERTO_POR_DEFECTO = 3000;
const CORS_POR_DEFECTO = [
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:5502',
  'http://127.0.0.1:5502',
];

function leerPuerto(valor) {
  if (valor === undefined || valor === '') return PUERTO_POR_DEFECTO;
  const puerto = Number(valor);
  if (!Number.isInteger(puerto) || puerto < 0 || puerto > 65535) {
    throw new Error(`PORT inválido: "${valor}". Debe ser un entero entre 0 y 65535.`);
  }
  return puerto;
}

function leerOrigenes(valor) {
  if (valor === undefined || valor.trim() === '') return [...CORS_POR_DEFECTO];
  return valor
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
}

function leerTexto(valor) {
  if (valor === undefined) return undefined;
  const texto = valor.trim();
  return texto === '' ? undefined : texto;
}

/**
 * Secreto para firmar los JWT (Requirement: Dueño de la autenticación).
 * Fuera de `test` es obligatorio. En `test`, si falta, se genera uno aleatorio por proceso
 * para no escribir ningún secreto en el código.
 */
function leerJwtSecret(valor, entorno) {
  const secreto = leerTexto(valor);
  if (secreto !== undefined) return secreto;
  if (entorno === 'test') return crypto.randomBytes(32).toString('hex');
  throw new Error(
    `Falta JWT_SECRET: el servicio no arranca sin él en el entorno "${entorno}". Defínelo en las variables de entorno.`
  );
}

/**
 * Construye la configuración a partir de las variables de entorno.
 * Recibe `env` como parámetro para poder probarla sin tocar `process.env`.
 */
function cargarConfig(env = process.env) {
  const entorno = env.NODE_ENV || 'development';
  return Object.freeze({
    entorno,
    puerto: leerPuerto(env.PORT),
    corsOrigenes: Object.freeze(leerOrigenes(env.CORS_ORIGINS)),
    // Implementación de repositorios (ADR-002): `memoria` (por defecto) o `sql`.
    repositorio: (env.REPOSITORIO || 'memoria').trim().toLowerCase(),
    jwtSecret: leerJwtSecret(env.JWT_SECRET, entorno),
    // Conexión a SQL Server para REPOSITORIO=sql (design §6). Nunca se escriben en el código.
    sql: Object.freeze({
      servidor: leerTexto(env.SQL_SERVER),
      baseDatos: leerTexto(env.SQL_DATABASE),
      usuario: leerTexto(env.SQL_USER),
      contrasena: leerTexto(env.SQL_PASSWORD),
    }),
    rutaBase: '/api/v1',
    rutaSpec: path.join(__dirname, '..', 'docs', 'specs', 'openapi.yaml'),
  });
}

module.exports = { cargarConfig, PUERTO_POR_DEFECTO, CORS_POR_DEFECTO };
