'use strict';

/**
 * Interfaces de repositorio (ADR-002). La lógica de negocio depende sólo de estas clases;
 * cada implementación (en memoria hoy, SQL Server después, ADR-004) las extiende.
 *
 * Reglas comunes a todas las implementaciones:
 * - Todos los métodos son asíncronos (devuelven una promesa).
 * - Las operaciones que dependen del tiempo reciben `ahora` (Date). El repositorio nunca
 *   usa la hora del sistema para decidir vencimientos (ADR-003, garantía 3).
 * - El repositorio no conoce la regla de 5 minutos: recibe `expiraEn` ya calculado (E15).
 * - Los errores de negocio se lanzan como `ErrorRepositorio` con un código de `CODIGOS`.
 * - Los objetos devueltos son copias: modificarlos no altera los datos guardados.
 * - Las fechas se devuelven como `Date` en UTC; la conversión a America/Mexico_City
 *   la hace la capa de API (P8, E6).
 *
 * @typedef {'disponible'|'apartado'|'comprado'} EstadoAsiento
 * @typedef {'activa'|'vencida'|'liberada'|'pagada'} EstadoReserva
 *
 * @typedef {Object} Evento
 * @property {string} id
 * @property {string} sitio
 * @property {string} nombre
 * @property {string} [descripcion]
 * @property {string} [recinto]
 *
 * @typedef {Object} Funcion
 * @property {string} id
 * @property {string} eventoId
 * @property {Date} inicio
 *
 * @typedef {Object} Zona
 * @property {string} id
 * @property {string} nombre
 * @property {number} precio  Precio de la zona en la función consultada
 * @property {string} moneda
 *
 * @typedef {Object} AsientoDeFuncion
 * @property {string} id
 * @property {string} zonaId
 * @property {string} fila
 * @property {number} numero
 * @property {string} etiqueta
 * @property {number} precio
 * @property {EstadoAsiento} estado
 *
 * @typedef {Object} AsientoReservado
 * @property {string} asientoId
 * @property {string} etiqueta
 * @property {string} zonaId
 * @property {number} precio  Precio tomado al apartar
 *
 * @typedef {Object} Reserva
 * @property {string} id
 * @property {string} sitio
 * @property {string} compradorId
 * @property {string} funcionId
 * @property {EstadoReserva} estado  `vencida` se calcula con `ahora`; nunca se guarda
 * @property {AsientoReservado[]} asientos
 * @property {number} total
 * @property {string} moneda
 * @property {Date} creadaEn
 * @property {Date} expiraEn
 * @property {string|null} ordenId
 *
 * @typedef {Object} IntentoPago
 * @property {string} id
 * @property {string} reservaId
 * @property {'aprobado'|'rechazado'} resultado
 * @property {Date} fecha
 *
 * @typedef {Object} Boleto
 * @property {string} id
 * @property {string} codigo  12 caracteres, único (E16)
 * @property {string} eventoId
 * @property {string} eventoNombre
 * @property {string} funcionId
 * @property {Date} inicio
 * @property {string} zonaId
 * @property {string} asientoId
 * @property {string} etiqueta
 * @property {number} precio
 *
 * @typedef {Object} Orden
 * @property {string} id
 * @property {string} numero  Folio visible, `ORD-000123` (E16)
 * @property {string} reservaId
 * @property {string} sitio
 * @property {string} compradorId
 * @property {Date} fecha
 * @property {number} total
 * @property {string} moneda
 * @property {Boleto[]} boletos
 */

const { NoImplementado } = require('./errores');

/** Catálogo: eventos, funciones, zonas y asientos con su estado. */
class AsientosRepo {
  /** @param {{ sitio?: string }} [filtro] @returns {Promise<Evento[]>} eventos activos */
  async listarEventos(filtro) { throw new NoImplementado('AsientosRepo.listarEventos'); }

  /** @param {string} eventoId @returns {Promise<Evento|null>} */
  async obtenerEvento(eventoId) { throw new NoImplementado('AsientosRepo.obtenerEvento'); }

  /**
   * Funciones activas del evento, ordenadas por inicio.
   * Lanza NO_ENCONTRADO si el evento no existe.
   * @param {string} eventoId @returns {Promise<Funcion[]>}
   */
  async listarFunciones(eventoId) { throw new NoImplementado('AsientosRepo.listarFunciones'); }

  /** @param {string} funcionId @returns {Promise<Funcion|null>} */
  async obtenerFuncion(funcionId) { throw new NoImplementado('AsientosRepo.obtenerFuncion'); }

  /**
   * Zonas con su precio en la función. Lanza NO_ENCONTRADO si la función no existe.
   * @param {string} funcionId @returns {Promise<Zona[]>}
   */
  async listarZonas(funcionId) { throw new NoImplementado('AsientosRepo.listarZonas'); }

  /**
   * Asientos de la función con precio y estado calculado a la hora `ahora`.
   * No revela quién aparta o compra. Lanza NO_ENCONTRADO si la función no existe.
   * @param {string} funcionId @param {Date} ahora @returns {Promise<AsientoDeFuncion[]>}
   */
  async listarAsientos(funcionId, ahora) { throw new NoImplementado('AsientosRepo.listarAsientos'); }
}

/** Reservas: apartar, consultar, contar, liberar y registrar pagos rechazados. */
class ReservasRepo {
  /**
   * Aparta todos los asientos o ninguno (garantía 1). Errores:
   * SOLICITUD_INVALIDA (lista vacía, repetida, de más de 10, asiento ajeno a la función,
   * `expiraEn <= ahora`), NO_ENCONTRADO (función), ASIENTO_NO_DISPONIBLE (con
   * `detalles.asientos`), LIMITE_EXCEDIDO (sólo si se indica `limitePorComprador`).
   * @param {{ sitio: string, compradorId: string, funcionId: string, asientoIds: string[],
   *           ahora: Date, expiraEn: Date, limitePorComprador?: number }} datos
   * @returns {Promise<Reserva>}
   */
  async crear(datos) { throw new NoImplementado('ReservasRepo.crear'); }

  /** @param {string} reservaId @param {Date} ahora @returns {Promise<Reserva|null>} */
  async obtener(reservaId, ahora) { throw new NoImplementado('ReservasRepo.obtener'); }

  /** Reservas activas y no vencidas. @param {string} compradorId @param {Date} ahora @returns {Promise<Reserva[]>} */
  async listarActivasDeComprador(compradorId, ahora) { throw new NoImplementado('ReservasRepo.listarActivasDeComprador'); }

  /**
   * Asientos del comprador en la función: apartados vigentes a la hora `ahora` más comprados
   * (regla de máximo 10, en cualquier sitio).
   * @param {{ compradorId: string, funcionId: string, ahora: Date }} datos @returns {Promise<number>}
   */
  async contarAsientosDeComprador(datos) { throw new NoImplementado('ReservasRepo.contarAsientosDeComprador'); }

  /**
   * Libera una reserva activa, vencida o no; sus asientos quedan disponibles.
   * Errores: NO_ENCONTRADO, RESERVA_PAGADA, RESERVA_LIBERADA.
   * @param {string} reservaId @param {Date} ahora @returns {Promise<Reserva>}
   */
  async liberar(reservaId, ahora) { throw new NoImplementado('ReservasRepo.liberar'); }

  /**
   * Registra un pago rechazado; la reserva sigue activa y su `expiraEn` no cambia (RN06).
   * Errores: NO_ENCONTRADO, RESERVA_PAGADA, RESERVA_LIBERADA, RESERVA_VENCIDA.
   * @param {{ reservaId: string, ahora: Date }} datos @returns {Promise<IntentoPago>}
   */
  async registrarPagoRechazado(datos) { throw new NoImplementado('ReservasRepo.registrarPagoRechazado'); }
}

/** Órdenes: pagar una reserva de forma atómica y consultar compras. */
class OrdenesRepo {
  /**
   * Pago aprobado atómico (garantía 2): intento aprobado, orden, boletos, reserva pagada
   * y asientos comprados. Errores: NO_ENCONTRADO, RESERVA_PAGADA, RESERVA_LIBERADA,
   * RESERVA_VENCIDA.
   * @param {{ reservaId: string, ahora: Date }} datos
   * @returns {Promise<{ intento: IntentoPago, orden: Orden }>}
   */
  async pagar(datos) { throw new NoImplementado('OrdenesRepo.pagar'); }

  /** @param {string} ordenId @returns {Promise<Orden|null>} */
  async obtener(ordenId) { throw new NoImplementado('OrdenesRepo.obtener'); }

  /** Órdenes del comprador, de la más antigua a la más reciente. @param {string} compradorId @returns {Promise<Orden[]>} */
  async listarDeComprador(compradorId) { throw new NoImplementado('OrdenesRepo.listarDeComprador'); }

  /**
   * Boletos con comprador, asiento, función, fecha de compra y monto (consolidación, RF15).
   * @returns {Promise<Array<Boleto & { ordenId: string, compradorId: string, sitio: string, fechaCompra: Date }>>}
   */
  async listarBoletos() { throw new NoImplementado('OrdenesRepo.listarBoletos'); }
}

module.exports = { AsientosRepo, ReservasRepo, OrdenesRepo };
