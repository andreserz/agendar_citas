'use strict';

const { OrdenesRepo } = require('../interfaces');
const {
  obtenerSlot,
  exigirReservaVigente,
  exigirFecha,
  idUnico,
  codigoBoletoUnico,
  siguienteFolio,
} = require('./almacen');

class OrdenesRepoMemoria extends OrdenesRepo {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  // Pago aprobado atómico (garantía 2): sin `await`, todo ocurre o nada ocurre.
  async pagar({ reservaId, ahora } = {}) {
    exigirFecha(ahora, 'ahora');
    const reserva = this.almacen.reservas.get(reservaId);
    exigirReservaVigente(reserva, ahora);

    const funcion = this.almacen.funciones.get(reserva.funcionId);
    const evento = this.almacen.eventos.get(funcion.eventoId);

    // Preparar todo antes de modificar el almacén.
    const intento = {
      id: idUnico('pag', this.almacen.intentos),
      reservaId,
      resultado: 'aprobado',
      fecha: new Date(ahora),
    };
    const orden = {
      id: idUnico('ord', this.almacen.ordenes),
      numero: siguienteFolio(this.almacen),
      reservaId,
      sitio: reserva.sitio,
      compradorId: reserva.compradorId,
      fecha: new Date(ahora),
      total: reserva.total,
      moneda: reserva.moneda,
      boletos: reserva.asientos.map((a, i) => ({
        id: `bol-${i + 1}`, // se completa abajo con el id de la orden
        codigo: codigoBoletoUnico(this.almacen),
        eventoId: evento.id,
        eventoNombre: evento.nombre,
        funcionId: funcion.id,
        inicio: new Date(funcion.inicio),
        zonaId: a.zonaId,
        asientoId: a.asientoId,
        etiqueta: a.etiqueta,
        precio: a.precio,
      })),
    };
    for (const boleto of orden.boletos) boleto.id = `${orden.id}-${boleto.id}`;

    // Aplicar.
    this.almacen.intentos.set(intento.id, intento);
    this.almacen.ordenes.set(orden.id, orden);
    reserva.estado = 'pagada';
    reserva.ordenId = orden.id;
    for (const { asientoId } of reserva.asientos) {
      Object.assign(obtenerSlot(this.almacen, reserva.funcionId, asientoId), {
        vendido: true,
        reservaId: null,
        expiraEn: null,
      });
    }

    return { intento: structuredClone(intento), orden: structuredClone(orden) };
  }

  async obtener(ordenId) {
    const orden = this.almacen.ordenes.get(ordenId);
    return orden ? structuredClone(orden) : null;
  }

  async listarDeComprador(compradorId) {
    return [...this.almacen.ordenes.values()]
      .filter((o) => o.compradorId === compradorId)
      .sort((a, b) => a.fecha - b.fecha)
      .map((o) => structuredClone(o));
  }

  async listarBoletos() {
    return [...this.almacen.ordenes.values()].flatMap((o) =>
      o.boletos.map((b) => ({
        ...structuredClone(b),
        ordenId: o.id,
        compradorId: o.compradorId,
        sitio: o.sitio,
        fechaCompra: new Date(o.fecha),
      }))
    );
  }
}

module.exports = { OrdenesRepoMemoria };
