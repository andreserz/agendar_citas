'use strict';

const { enviarError } = require('../errores');

// Sitios del contrato (esquema `Sitio` de openapi.yaml).
const SITIOS_VALIDOS = Object.freeze(['web_1', 'web_2']);

/**
 * Requirement: Validación de X-Sitio.
 * Toda petición a `/api/v1`, excepto `GET /salud`, trae `X-Sitio` con `web_1` o `web_2`.
 * Si falta o no es válido → `400 SOLICITUD_INVALIDA` con `detalles.campo = "X-Sitio"`.
 * El valor validado queda en `req.sitio` para los controladores.
 *
 * `esRutaDelContrato(metodo, ruta)` (opcional) deja pasar sin validar las rutas que no están
 * en el contrato, para que respondan `404 NO_ENCONTRADO`.
 */
function crearValidarSitio({ esRutaDelContrato } = {}) {
  return function validarSitio(req, res, next) {
    if (req.method === 'GET' && /^\/salud\/?$/.test(req.path)) return next();
    if (esRutaDelContrato && !esRutaDelContrato(req.method, req.path)) return next();

    const sitio = req.get('X-Sitio');
    if (!SITIOS_VALIDOS.includes(sitio)) {
      const mensaje = sitio
        ? 'El encabezado X-Sitio no corresponde a un sitio válido.'
        : 'Falta el encabezado X-Sitio.';
      return enviarError(res, 400, 'SOLICITUD_INVALIDA', mensaje, { campo: 'X-Sitio' });
    }
    req.sitio = sitio;
    return next();
  };
}

module.exports = { crearValidarSitio, SITIOS_VALIDOS };
