'use strict';

const jwt = require('jsonwebtoken');

// Token del comprador (Requirement: Dueño de la autenticación): HS256, 8 horas, `sub` = id del comprador.
// El secreto viene de `config.jwtSecret` (variable JWT_SECRET); nunca se escribe en el código.
const ALGORITMO = 'HS256';
const DURACION_SEGUNDOS = 8 * 60 * 60;

function validarSecreto(secreto) {
  if (typeof secreto !== 'string' || secreto === '') {
    throw new TypeError('Falta el secreto para firmar o validar el token (JWT_SECRET).');
  }
}

/**
 * Emite el token de un comprador.
 * `ahora` permite usar el reloj inyectado del servicio en lugar del reloj del sistema.
 */
function emitirToken(compradorId, secreto, ahora = new Date()) {
  validarSecreto(secreto);
  if (compradorId === undefined || compradorId === null || String(compradorId) === '') {
    throw new TypeError('Falta el id del comprador para emitir el token.');
  }
  const iat = Math.floor(ahora.getTime() / 1000);
  return jwt.sign({ sub: String(compradorId), iat, exp: iat + DURACION_SEGUNDOS }, secreto, {
    algorithm: ALGORITMO,
  });
}

/**
 * Valida un token y devuelve el id del comprador (`sub`), o `null` si el token
 * no es válido, está vencido, usa otro algoritmo o no trae `sub`.
 */
function verificarToken(token, secreto, ahora = new Date()) {
  validarSecreto(secreto);
  if (typeof token !== 'string' || token === '') return null;
  try {
    const datos = jwt.verify(token, secreto, {
      algorithms: [ALGORITMO],
      clockTimestamp: Math.floor(ahora.getTime() / 1000),
    });
    return typeof datos.sub === 'string' && datos.sub !== '' ? datos.sub : null;
  } catch {
    return null;
  }
}

module.exports = { emitirToken, verificarToken, DURACION_SEGUNDOS };
