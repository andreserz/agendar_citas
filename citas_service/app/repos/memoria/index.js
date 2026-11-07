'use strict';

const { crearAlmacen } = require('./almacen');
const { AsientosRepoMemoria } = require('./asientos-repo-memoria');
const { ReservasRepoMemoria } = require('./reservas-repo-memoria');
const { OrdenesRepoMemoria } = require('./ordenes-repo-memoria');

/**
 * Crea los tres repositorios en memoria sobre un mismo almacén, cargado con los datos
 * iniciales de web_1. Cada llamada crea un almacén nuevo (útil para aislar pruebas).
 */
function crearReposEnMemoria(datos) {
  const almacen = crearAlmacen(datos);
  return {
    asientosRepo: new AsientosRepoMemoria(almacen),
    reservasRepo: new ReservasRepoMemoria(almacen),
    ordenesRepo: new OrdenesRepoMemoria(almacen),
  };
}

module.exports = { crearReposEnMemoria };
