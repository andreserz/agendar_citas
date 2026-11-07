'use strict';

const { ReservasRepo } = require('../interfaces');
const { CODIGOS, ErrorRepositorio } = require('../errores');
const {
  clave,
  obtenerSlot,
  estadoAsiento,
  estadoReserva,
  vistaReserva,
  exigirReservaVigente,
  exigirFecha,
  exigirTexto,
  idUnico,
} = require('./almacen');

// Tope por reserva definido en la spec (`NuevaReserva.asientoIds.maxItems`).
const MAX_ASIENTOS_POR_RESERVA = 10;

class ReservasRepoMemoria extends ReservasRepo {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  // Sin `await` en todo el cuerpo: verificar y apartar ocurre de forma atómica.
  async crear({ sitio, compradorId, funcionId, asientoIds, ahora, expiraEn, limitePorComprador } = {}) {
    exigirFecha(ahora, 'ahora');
    exigirFecha(expiraEn, 'expiraEn');
    exigirTexto(sitio, 'sitio');
    exigirTexto(compradorId, 'compradorId');
    if (expiraEn <= ahora) {
      throw new ErrorRepositorio(CODIGOS.SOLICITUD_INVALIDA, 'expiraEn debe ser posterior a ahora.');
    }
    validarListaAsientos(asientoIds);

    const funcion = this.almacen.funciones.get(funcionId);
    if (!funcion || !funcion.activa) {
      throw new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, 'Función no encontrada.');
    }
    const sitioEvento = this.almacen.eventos.get(funcion.eventoId).sitio;

    // Todos los asientos deben existir y pertenecer al recinto de la función.
    const ajenos = asientoIds.filter((id) => {
      const asiento = this.almacen.asientos.get(id);
      return !asiento || !asiento.activo || this.almacen.zonas.get(asiento.zonaId).sitio !== sitioEvento;
    });
    if (ajenos.length > 0) {
      throw new ErrorRepositorio(
        CODIGOS.SOLICITUD_INVALIDA,
        'Hay asientos que no pertenecen a la función.',
        { asientoIds: ajenos }
      );
    }

    // Todo o nada (P9, BCK RN08).
    const noDisponibles = asientoIds
      .map((id) => ({ id, estado: estadoAsiento(this.almacen, funcionId, id, ahora) }))
      .filter((a) => a.estado !== 'disponible')
      .map((a) => ({
        asientoId: a.id,
        etiqueta: this.almacen.asientos.get(a.id).etiqueta,
        estado: a.estado,
      }));
    if (noDisponibles.length > 0) {
      throw new ErrorRepositorio(
        CODIGOS.ASIENTO_NO_DISPONIBLE,
        'Algunos asientos ya no están disponibles.',
        { asientos: noDisponibles }
      );
    }

    // Límite por persona y función, validado en la misma operación (PR4, BCK RN09).
    if (limitePorComprador !== undefined && limitePorComprador !== null) {
      const actuales = this.#contar(compradorId, funcionId, ahora);
      if (actuales + asientoIds.length > limitePorComprador) {
        throw new ErrorRepositorio(
          CODIGOS.LIMITE_EXCEDIDO,
          `Supera el máximo de ${limitePorComprador} asientos por persona y función.`,
          { limite: limitePorComprador, actuales, solicitados: asientoIds.length }
        );
      }
    }

    const asientos = asientoIds.map((id) => {
      const asiento = this.almacen.asientos.get(id);
      const zona = this.almacen.zonas.get(asiento.zonaId);
      const precio = this.almacen.precios.get(clave(funcionId, zona.id));
      if (precio === undefined) {
        throw new Error(`Falta el precio de la zona ${zona.id} en la función ${funcionId}.`);
      }
      return { asientoId: id, etiqueta: asiento.etiqueta, zonaId: zona.id, precio, moneda: zona.moneda };
    });

    const reserva = {
      id: idUnico('res', this.almacen.reservas),
      sitio,
      compradorId,
      funcionId,
      estado: 'activa',
      asientos: asientos.map(({ moneda, ...resto }) => resto),
      total: asientos.reduce((suma, a) => suma + a.precio, 0),
      moneda: asientos[0].moneda,
      creadaEn: new Date(ahora),
      expiraEn: new Date(expiraEn),
      ordenId: null,
    };

    this.almacen.reservas.set(reserva.id, reserva);
    for (const id of asientoIds) {
      Object.assign(obtenerSlot(this.almacen, funcionId, id), {
        vendido: false,
        reservaId: reserva.id,
        expiraEn: reserva.expiraEn,
      });
    }
    return vistaReserva(reserva, ahora);
  }

  async obtener(reservaId, ahora) {
    exigirFecha(ahora, 'ahora');
    const reserva = this.almacen.reservas.get(reservaId);
    return reserva ? vistaReserva(reserva, ahora) : null;
  }

  async listarActivasDeComprador(compradorId, ahora) {
    exigirFecha(ahora, 'ahora');
    return [...this.almacen.reservas.values()]
      .filter((r) => r.compradorId === compradorId && estadoReserva(r, ahora) === 'activa')
      .map((r) => vistaReserva(r, ahora));
  }

  async contarAsientosDeComprador({ compradorId, funcionId, ahora } = {}) {
    exigirFecha(ahora, 'ahora');
    return this.#contar(compradorId, funcionId, ahora);
  }

  async liberar(reservaId, ahora) {
    exigirFecha(ahora, 'ahora');
    const reserva = this.almacen.reservas.get(reservaId);
    if (!reserva) throw new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, 'Reserva no encontrada.');
    if (reserva.estado === 'pagada') {
      throw new ErrorRepositorio(CODIGOS.RESERVA_PAGADA, 'La reserva ya está pagada.');
    }
    if (reserva.estado === 'liberada') {
      throw new ErrorRepositorio(CODIGOS.RESERVA_LIBERADA, 'La reserva ya fue liberada.');
    }

    // Activa, vencida o no (BCK RN12).
    reserva.estado = 'liberada';
    for (const { asientoId } of reserva.asientos) {
      const slot = obtenerSlot(this.almacen, reserva.funcionId, asientoId);
      // Sólo se limpia si el asiento no lo tomó otra reserva después de vencer ésta.
      if (slot.reservaId === reserva.id) Object.assign(slot, { reservaId: null, expiraEn: null });
    }
    return vistaReserva(reserva, ahora);
  }

  async registrarPagoRechazado({ reservaId, ahora } = {}) {
    exigirFecha(ahora, 'ahora');
    exigirReservaVigente(this.almacen.reservas.get(reservaId), ahora);
    const intento = {
      id: idUnico('pag', this.almacen.intentos),
      reservaId,
      resultado: 'rechazado',
      fecha: new Date(ahora),
    };
    this.almacen.intentos.set(intento.id, intento);
    return structuredClone(intento);
  }

  // Apartados vigentes + comprados del comprador en la función, en cualquier sitio (RN04).
  #contar(compradorId, funcionId, ahora) {
    let total = 0;
    for (const r of this.almacen.reservas.values()) {
      if (r.compradorId !== compradorId || r.funcionId !== funcionId) continue;
      const estado = estadoReserva(r, ahora);
      if (estado === 'activa' || estado === 'pagada') total += r.asientos.length;
    }
    return total;
  }
}

function validarListaAsientos(asientoIds) {
  const valida =
    Array.isArray(asientoIds) &&
    asientoIds.length >= 1 &&
    asientoIds.length <= MAX_ASIENTOS_POR_RESERVA &&
    asientoIds.every((id) => typeof id === 'string' && id !== '') &&
    new Set(asientoIds).size === asientoIds.length;
  if (!valida) {
    throw new ErrorRepositorio(
      CODIGOS.SOLICITUD_INVALIDA,
      `La lista de asientos debe tener de 1 a ${MAX_ASIENTOS_POR_RESERVA} asientos sin repetir.`
    );
  }
}

module.exports = { ReservasRepoMemoria, MAX_ASIENTOS_POR_RESERVA };
