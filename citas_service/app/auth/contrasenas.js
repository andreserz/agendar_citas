'use strict';

const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

// Hash calculado en el servicio con crypto.scrypt y sal aleatoria por comprador (E3, P5).
// Formato guardado en `HashContrasena` (VARCHAR(255)): scrypt$<sal base64>$<hash base64> (~122 caracteres).
const PREFIJO = 'scrypt';
const BYTES_SAL = 16;
const BYTES_HASH = 64;

/** Calcula el hash que se guarda en la base de datos. Nunca se guarda la contraseña en texto plano. */
async function hashContrasena(contrasena) {
  if (typeof contrasena !== 'string' || contrasena === '') {
    throw new TypeError('La contraseña debe ser un texto no vacío.');
  }
  const sal = crypto.randomBytes(BYTES_SAL);
  const hash = await scrypt(contrasena, sal, BYTES_HASH);
  return `${PREFIJO}$${sal.toString('base64')}$${hash.toString('base64')}`;
}

/**
 * Compara una contraseña con un hash guardado, en tiempo constante.
 * Devuelve `false` (sin lanzar) si el hash guardado no tiene el formato esperado.
 */
async function verificarContrasena(contrasena, hashGuardado) {
  if (typeof contrasena !== 'string' || typeof hashGuardado !== 'string') return false;
  const partes = hashGuardado.split('$');
  if (partes.length !== 3 || partes[0] !== PREFIJO) return false;
  const sal = Buffer.from(partes[1], 'base64');
  const esperado = Buffer.from(partes[2], 'base64');
  if (sal.length !== BYTES_SAL || esperado.length !== BYTES_HASH) return false;
  const calculado = await scrypt(contrasena, sal, BYTES_HASH);
  return crypto.timingSafeEqual(calculado, esperado);
}

module.exports = { hashContrasena, verificarContrasena };
