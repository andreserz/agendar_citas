'use strict';

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

/**
 * Construye la configuración a partir de las variables de entorno.
 * Recibe `env` como parámetro para poder probarla sin tocar `process.env`.
 */
function cargarConfig(env = process.env) {
  return Object.freeze({
    entorno: env.NODE_ENV || 'development',
    puerto: leerPuerto(env.PORT),
    corsOrigenes: Object.freeze(leerOrigenes(env.CORS_ORIGINS)),
    // Implementación de repositorios (ADR-002): `memoria` hasta que exista el adaptador (ADR-004).
    repositorio: (env.REPOSITORIO || 'memoria').trim().toLowerCase(),
    rutaBase: '/api/v1',
    rutaSpec: path.join(__dirname, '..', 'docs', 'specs', 'openapi.yaml'),
  });
}

module.exports = { cargarConfig, PUERTO_POR_DEFECTO, CORS_POR_DEFECTO };
