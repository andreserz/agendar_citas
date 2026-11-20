'use strict';

const { validarRespuesta } = require('./openapi');

/**
 * Verifica que la respuesta tenga el `status` esperado y cumpla lo que la spec declara para
 * ese status en la operación `operationId`. Si falla, el diff muestra el status, los errores
 * de forma y el cuerpo recibido.
 */
function esperarContrato(operationId, res, status) {
  const errores = validarRespuesta(operationId, res);
  const recibido = { status: res.status, errores };
  const esperado = { status, errores: [] };
  if (res.status !== status || errores.length > 0) recibido.cuerpo = res.body;
  expect(recibido).toEqual(esperado);
  return res;
}

/** Igual que `esperarContrato` y además exige `error.codigo` (y `detalles` si se indica). */
function esperarError(operationId, res, status, codigo, detalles) {
  esperarContrato(operationId, res, status);
  expect(res.body.error.codigo).toBe(codigo);
  if (detalles !== undefined) expect(res.body.error.detalles).toMatchObject(detalles);
  return res;
}

module.exports = { esperarContrato, esperarError };
