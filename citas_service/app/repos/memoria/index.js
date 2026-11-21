'use strict';

const { crearAlmacen } = require('./almacen');
const { SitiosRepoMemoria } = require('./sitios-repo-memoria');
const { AsientosRepoMemoria } = require('./asientos-repo-memoria');
const { ReservasRepoMemoria } = require('./reservas-repo-memoria');
const { OrdenesRepoMemoria } = require('./ordenes-repo-memoria');
const { ReportesRepoMemoria } = require('./reportes-repo-memoria');

/**
 * Crea los repositorios en memoria sobre un mismo almacén, cargado con los datos
 * iniciales de web_1 y web_2. Cada llamada crea un almacén nuevo (útil para aislar pruebas).
 */
function crearReposEnMemoria(datos) {
  const almacen = crearAlmacen(datos);
  return {
    sitiosRepo: new SitiosRepoMemoria(almacen),
    asientosRepo: new AsientosRepoMemoria(almacen),
    reservasRepo: new ReservasRepoMemoria(almacen),
    ordenesRepo: new OrdenesRepoMemoria(almacen),
    reportesRepo: new ReportesRepoMemoria(almacen),
  };
}

module.exports = { crearReposEnMemoria };
