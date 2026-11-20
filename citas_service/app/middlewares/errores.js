'use strict';

const { enviarError } = require('../errores');
const { ErrorRepositorio } = require('../repos/errores');

/**
 * Requirement: Traducción de errores al formato del contrato.
 * Convierte cualquier error en `{ error: { codigo, mensaje, detalles? } }` con el status HTTP
 * de la tabla «Mapeo de errores» del contrato (contrato-entre-capas).
 */

// Status HTTP de cada `codigo` de API (enum `Error.codigo` de openapi.yaml).
const STATUS_POR_CODIGO = Object.freeze({
  SOLICITUD_INVALIDA: 400,
  NO_AUTENTICADO: 401,
  NO_ENCONTRADO: 404,
  ASIENTO_NO_DISPONIBLE: 409,
  CORREO_REGISTRADO: 409,
  RESERVA_PAGADA: 409,
  RESERVA_VENCIDA: 410,
  RESERVA_LIBERADA: 410,
  LIMITE_EXCEDIDO: 422,
  ERROR_INTERNO: 500,
});

// Mensajes en español para los errores que vienen de la base de datos (no se expone su texto).
const MENSAJES = Object.freeze({
  SOLICITUD_INVALIDA: 'La solicitud no es válida.',
  NO_AUTENTICADO: 'Se requiere iniciar sesión.',
  NO_ENCONTRADO: 'El recurso solicitado no existe.',
  ASIENTO_NO_DISPONIBLE: 'Uno o más asientos ya no están disponibles.',
  CORREO_REGISTRADO: 'El correo ya está registrado.',
  RESERVA_PAGADA: 'La reserva ya está pagada.',
  RESERVA_VENCIDA: 'La reserva ya venció.',
  RESERVA_LIBERADA: 'La reserva ya fue liberada.',
  LIMITE_EXCEDIDO: 'Se excede el límite de asientos permitido.',
  ERROR_INTERNO: 'Ocurrió un error inesperado.',
});

// Tabla exacta del contrato: código de `THROW` de la base de datos → `codigo` de API.
const CODIGO_POR_NUMERO = Object.freeze({
  51001: 'ASIENTO_NO_DISPONIBLE',
  51002: 'CORREO_REGISTRADO',
  51003: 'RESERVA_PAGADA',
  52001: 'RESERVA_VENCIDA',
  52002: 'RESERVA_LIBERADA',
  53001: 'LIMITE_EXCEDIDO',
  53002: 'SOLICITUD_INVALIDA',
  53003: 'SOLICITUD_INVALIDA',
  53004: 'ERROR_INTERNO',
  53005: 'SOLICITUD_INVALIDA',
  53006: 'SOLICITUD_INVALIDA',
  53007: 'SOLICITUD_INVALIDA',
  53008: 'SOLICITUD_INVALIDA',
  54001: 'NO_ENCONTRADO',
  54002: 'NO_ENCONTRADO',
  54003: 'NO_ENCONTRADO',
  54004: 'NO_ENCONTRADO',
  54005: 'NO_ENCONTRADO',
});

/** `50000` o cualquier número no listado → `ERROR_INTERNO`. */
function codigoDeBaseDatos(numero) {
  return CODIGO_POR_NUMERO[Number(numero)] || 'ERROR_INTERNO';
}

function esNumeroDeBaseDatos(valor) {
  return (typeof valor === 'number' && Number.isInteger(valor)) || (typeof valor === 'string' && /^\d+$/.test(valor));
}

function respuesta(codigo, mensaje, detalles) {
  const status = STATUS_POR_CODIGO[codigo];
  // Un 500 nunca lleva detalles ni el texto original.
  if (status === 500) return { status, codigo, mensaje: MENSAJES.ERROR_INTERNO };
  return { status, codigo, mensaje, ...(detalles !== undefined ? { detalles } : {}) };
}

/**
 * Traduce un error a `{ status, codigo, mensaje, detalles? }`.
 * - JSON mal formado → 400 SOLICITUD_INVALIDA.
 * - `ErrorRepositorio` con `codigo` de API (repositorio en memoria) → su status; se conserva su mensaje.
 * - `ErrorRepositorio` con número de la base de datos (adaptador SQL) → tabla del contrato.
 * - `RequestError` de `mssql` con `number` → tabla del contrato.
 * - Cualquier otro → 500 ERROR_INTERNO.
 */
function traducirError(err) {
  if (err && err.type === 'entity.parse.failed') {
    return respuesta('SOLICITUD_INVALIDA', 'El cuerpo de la petición no es JSON válido.');
  }
  if (err instanceof ErrorRepositorio) {
    if (esNumeroDeBaseDatos(err.codigo)) {
      const codigo = codigoDeBaseDatos(err.codigo);
      return respuesta(codigo, MENSAJES[codigo], err.detalles);
    }
    if (STATUS_POR_CODIGO[err.codigo]) {
      return respuesta(err.codigo, err.message || MENSAJES[err.codigo], err.detalles);
    }
    return respuesta('ERROR_INTERNO');
  }
  if (err && err.name === 'RequestError' && esNumeroDeBaseDatos(err.number)) {
    const codigo = codigoDeBaseDatos(err.number);
    return respuesta(codigo, MENSAJES[codigo]);
  }
  return respuesta('ERROR_INTERNO');
}

/**
 * Manejador de errores de Express. Los 500 se registran en log solo con el tipo y el código,
 * nunca con el mensaje ni el cuerpo de la petición (pueden traer datos sensibles).
 */
function crearManejadorErrores({ entorno, registrar = console.error } = {}) {
  // eslint-disable-next-line no-unused-vars
  return function manejadorErrores(err, req, res, next) {
    const r = traducirError(err);
    if (r.status === 500 && entorno !== 'test') {
      registrar('[citas_service] Error interno:', {
        tipo: (err && err.name) || typeof err,
        codigo: err && (err.codigo !== undefined ? err.codigo : err.number),
        metodo: req.method,
        ruta: req.path,
      });
    }
    return enviarError(res, r.status, r.codigo, r.mensaje, r.detalles);
  };
}

module.exports = {
  crearManejadorErrores,
  traducirError,
  codigoDeBaseDatos,
  STATUS_POR_CODIGO,
  CODIGO_POR_NUMERO,
};
