'use strict';

/**
 * Fechas de la API en hora de Ciudad de México (D13, contrato «Fechas y zona horaria»).
 * CDMX es UTC−6 todo el año, así que el desplazamiento es fijo. Los repositorios trabajan
 * en UTC; la conversión ocurre sólo al responder (o al leer fechas de la consulta).
 */
const DESFASE_MS = 6 * 60 * 60 * 1000;
const UN_DIA_MS = 24 * 60 * 60 * 1000;

/** `Date` (UTC) → `'2026-11-12T19:00:00-06:00'`. */
function aCdmx(fecha) {
  const local = new Date(new Date(fecha).getTime() - DESFASE_MS);
  return `${local.toISOString().slice(0, 19)}-06:00`;
}

/** Día calendario en CDMX de un `Date` (UTC): `'2026-11-12'`. */
function diaCdmx(fecha) {
  return new Date(new Date(fecha).getTime() - DESFASE_MS).toISOString().slice(0, 10);
}

/**
 * Lee un día `AAAA-MM-DD` y devuelve su número de día (días desde 1970-01-01), o `null`
 * si el texto no tiene ese formato o no es una fecha real (p. ej. `2026-02-30`).
 */
function leerDia(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  const ms = Date.parse(`${texto}T00:00:00Z`);
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== texto) return null;
  return ms / UN_DIA_MS;
}

/** Número de día → `'AAAA-MM-DD'`. */
function textoDia(numeroDia) {
  return new Date(numeroDia * UN_DIA_MS).toISOString().slice(0, 10);
}

module.exports = { aCdmx, diaCdmx, leerDia, textoDia };
