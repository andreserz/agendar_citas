'use strict';

const { ReportesRepo } = require('../interfaces');
const { diaCdmx } = require('../../fechas');

class ReportesRepoMemoria extends ReportesRepo {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  // Cuenta todas las reservas creadas (activas, vencidas, liberadas o pagadas).
  async contarReservasPorDia({ sitio, desde, hasta } = {}) {
    const porDia = new Map();
    for (const reserva of this.almacen.reservas.values()) {
      if (reserva.sitio !== sitio) continue;
      const fecha = diaCdmx(reserva.creadaEn);
      if (fecha < desde || fecha > hasta) continue;
      porDia.set(fecha, (porDia.get(fecha) || 0) + 1);
    }
    return [...porDia.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([fecha, reservas]) => ({ fecha, reservas }));
  }
}

module.exports = { ReportesRepoMemoria };
