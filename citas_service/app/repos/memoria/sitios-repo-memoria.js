'use strict';

const { SitiosRepo } = require('../interfaces');

/**
 * Sitios en memoria: `web_1` con `requiereComprador = true` (RequiereComprador = 1) y
 * `web_2` con `requiereComprador = false` (RequiereComprador = 0), según la semilla.
 */
class SitiosRepoMemoria extends SitiosRepo {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  async listar() {
    return [...this.almacen.sitios.values()].map(vistaSitio);
  }

  async obtener(sitioId) {
    const sitio = this.almacen.sitios.get(sitioId);
    return sitio ? vistaSitio(sitio) : null;
  }
}

function vistaSitio({ id, nombre, requiereComprador }) {
  return { id, nombre, requiereComprador: requiereComprador === true };
}

module.exports = { SitiosRepoMemoria };
