'use strict';

/**
 * Envía un error con el formato del esquema `Error` de docs/specs/openapi.yaml:
 * { "error": { "codigo", "mensaje", "detalles"? } }
 */
function enviarError(res, status, codigo, mensaje, detalles) {
  const error = { codigo, mensaje };
  if (detalles !== undefined) error.detalles = detalles;
  return res.status(status).json({ error });
}

module.exports = { enviarError };
