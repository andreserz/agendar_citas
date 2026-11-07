'use strict';

const crypto = require('crypto');
const { CODIGOS, ErrorRepositorio } = require('../errores');
const { generarDatosIniciales } = require('./datos-iniciales');

/**
 * Estado compartido por los tres repositorios en memoria. Equivale a la base de datos:
 * se pierde al reiniciar (ADR-002).
 *
 * Atomicidad: cada operación de los repositorios corre completa sin `await` intermedio.
 * Node.js no intercala otra petición a la mitad, así que verificar y modificar dentro de
 * la misma función equivale a una transacción (RN02).
 */
function crearAlmacen(datos = generarDatosIniciales()) {
  const porId = (lista) => new Map(lista.map((x) => [x.id, structuredClone(x)]));
  return {
    sitios: porId(datos.sitios),
    eventos: porId(datos.eventos),
    zonas: porId(datos.zonas),
    asientos: porId(datos.asientos),
    funciones: porId(datos.funciones),
    precios: new Map(datos.precios.map((p) => [clave(p.funcionId, p.zonaId), p.precio])),
    // Estado de cada asiento en cada función: { vendido, reservaId, expiraEn }. Se crea al usarse.
    asientosFuncion: new Map(),
    reservas: new Map(),
    intentos: new Map(),
    ordenes: new Map(),
    codigosBoleto: new Set(),
    secuenciaOrden: 0,
  };
}

const clave = (a, b) => `${a}|${b}`;

function obtenerSlot(almacen, funcionId, asientoId) {
  const k = clave(funcionId, asientoId);
  let slot = almacen.asientosFuncion.get(k);
  if (!slot) {
    slot = { vendido: false, reservaId: null, expiraEn: null };
    almacen.asientosFuncion.set(k, slot);
  }
  return slot;
}

/** Estado de un asiento en una función a la hora `ahora` (BCK RN01, ADR-003). */
function estadoAsiento(almacen, funcionId, asientoId, ahora) {
  const slot = almacen.asientosFuncion.get(clave(funcionId, asientoId));
  if (!slot) return 'disponible';
  if (slot.vendido) return 'comprado';
  if (slot.reservaId && slot.expiraEn > ahora) return 'apartado';
  return 'disponible';
}

/** Estado de una reserva a la hora `ahora`: `vencida` se calcula, nunca se guarda. */
function estadoReserva(reserva, ahora) {
  if (reserva.estado === 'activa' && reserva.expiraEn <= ahora) return 'vencida';
  return reserva.estado;
}

/** Copia de la reserva con el estado calculado; nunca se entrega el objeto guardado. */
function vistaReserva(reserva, ahora) {
  return { ...structuredClone(reserva), estado: estadoReserva(reserva, ahora) };
}

/** Lanza el error que corresponde si la reserva no se puede pagar ni modificar. */
function exigirReservaVigente(reserva, ahora) {
  if (!reserva) throw new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, 'Reserva no encontrada.');
  if (reserva.estado === 'pagada') {
    throw new ErrorRepositorio(CODIGOS.RESERVA_PAGADA, 'La reserva ya está pagada.');
  }
  if (reserva.estado === 'liberada') {
    throw new ErrorRepositorio(CODIGOS.RESERVA_LIBERADA, 'La reserva fue liberada.');
  }
  if (estadoReserva(reserva, ahora) === 'vencida') {
    throw new ErrorRepositorio(CODIGOS.RESERVA_VENCIDA, 'La reserva venció.');
  }
}

function exigirFecha(valor, nombre) {
  if (!(valor instanceof Date) || Number.isNaN(valor.getTime())) {
    throw new TypeError(`${nombre} debe ser una fecha (Date) válida.`);
  }
}

function exigirTexto(valor, nombre) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new ErrorRepositorio(CODIGOS.SOLICITUD_INVALIDA, `Falta ${nombre}.`);
  }
}

/** Identificador aleatorio difícil de adivinar, p. ej. `res-8f3a2c1d`. */
function idUnico(prefijo, existentes) {
  let id;
  do {
    id = `${prefijo}-${crypto.randomBytes(4).toString('hex')}`;
  } while (existentes.has(id));
  return id;
}

// Código de boleto: 12 caracteres de un alfabeto de 32 símbolos sin 0, O, 1 ni I (BCK RN20).
const ALFABETO_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LARGO_CODIGO = 12;

function codigoBoletoUnico(almacen) {
  let codigo;
  do {
    codigo = Array.from(
      { length: LARGO_CODIGO },
      () => ALFABETO_CODIGO[crypto.randomInt(ALFABETO_CODIGO.length)]
    ).join('');
  } while (almacen.codigosBoleto.has(codigo));
  almacen.codigosBoleto.add(codigo);
  return codigo;
}

/** Folio visible de la orden: `ORD-` + número con al menos 6 dígitos (BCK RN19). */
function siguienteFolio(almacen) {
  almacen.secuenciaOrden += 1;
  return `ORD-${String(almacen.secuenciaOrden).padStart(6, '0')}`;
}

module.exports = {
  crearAlmacen,
  clave,
  obtenerSlot,
  estadoAsiento,
  estadoReserva,
  vistaReserva,
  exigirReservaVigente,
  exigirFecha,
  exigirTexto,
  idUnico,
  codigoBoletoUnico,
  siguienteFolio,
  ALFABETO_CODIGO,
  LARGO_CODIGO,
};
