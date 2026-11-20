'use strict';

const { verificarToken } = require('../auth/tokens');
const { enviarError } = require('../errores');

/**
 * Requirement: Sitios sin cuenta / Reglas de identidad por sitio.
 *
 * Se usa solo en las rutas de comprador (crear reserva, consultar/liberar/pagar, listar reservas
 * y órdenes). La regla se consulta en el repositorio de sitios (`requiereComprador`), sin repetirla:
 * - Sitio con `requiereComprador = true` (`web_1`): exige `Authorization: Bearer <token>` válido.
 *   Si falta o no es válido → `401 NO_AUTENTICADO`. Deja `req.compradorId`.
 * - Sitio con `requiereComprador = false` (`web_2`): pasa sin token; `req.compradorId` queda vacío.
 * En ambos casos deja `req.requiereComprador` (para el límite de 10 asientos y la propiedad de la reserva).
 *
 * Debe ir después de `validarSitio` (usa `req.sitio`).
 */
const MENSAJE_NO_AUTENTICADO = 'Se requiere iniciar sesión.';

function leerBearer(req) {
  const valor = req.get('Authorization');
  if (typeof valor !== 'string') return null;
  const coincide = /^Bearer\s+(\S+)\s*$/i.exec(valor);
  return coincide ? coincide[1] : null;
}

function crearAutenticarComprador({ sitiosRepo, jwtSecret, reloj = () => new Date() } = {}) {
  return async function autenticarComprador(req, res, next) {
    try {
      if (!sitiosRepo) throw new Error('autenticarComprador necesita el repositorio de sitios.');
      const sitio = await sitiosRepo.obtener(req.sitio);
      if (!sitio) {
        return enviarError(res, 400, 'SOLICITUD_INVALIDA', 'El encabezado X-Sitio no corresponde a un sitio válido.', {
          campo: 'X-Sitio',
        });
      }

      req.requiereComprador = sitio.requiereComprador === true;
      req.compradorId = undefined;
      if (!req.requiereComprador) return next();

      const compradorId = verificarToken(leerBearer(req), jwtSecret, reloj());
      if (!compradorId) return enviarError(res, 401, 'NO_AUTENTICADO', MENSAJE_NO_AUTENTICADO);

      req.compradorId = compradorId;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { crearAutenticarComprador };
