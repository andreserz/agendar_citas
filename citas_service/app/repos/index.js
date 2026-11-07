'use strict';

const { crearReposEnMemoria } = require('./memoria');

/**
 * Elige la implementación de repositorios con la variable de entorno REPOSITORIO (ADR-002).
 * Hoy sólo existe `memoria`; el adaptador a SQL Server se agregará aquí (ADR-004).
 */
function crearRepos(config) {
  switch (config.repositorio) {
    case 'memoria':
      return crearReposEnMemoria();
    default:
      throw new Error(
        `REPOSITORIO="${config.repositorio}" no está disponible. Valores válidos: memoria.`
      );
  }
}

module.exports = { crearRepos };
