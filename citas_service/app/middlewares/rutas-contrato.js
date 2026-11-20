'use strict';

/**
 * Construye, a partir de `openapi.yaml`, una función que dice si un método y una ruta
 * (relativa a `/api/v1`) son una operación del contrato. Así la spec manda (AGENTS.md §2):
 * una ruta que no está en el contrato responde `404` aunque no traiga `X-Sitio`.
 */
const METODOS = ['get', 'post', 'put', 'patch', 'delete'];

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function patronDeRuta(rutaSpec) {
  // `/eventos/{eventoId}` → /^\/eventos\/[^/]+\/?$/
  const partes = rutaSpec.split(/\{[^}]+\}/).map(escaparRegex);
  return new RegExp(`^${partes.join('[^/]+')}/?$`);
}

function crearBuscadorDeRutas(spec) {
  const operaciones = Object.entries((spec && spec.paths) || {}).map(([ruta, definicion]) => ({
    patron: patronDeRuta(ruta),
    metodos: new Set(METODOS.filter((metodo) => definicion && definicion[metodo])),
  }));

  return function esRutaDelContrato(metodo, ruta) {
    const m = String(metodo).toLowerCase() === 'head' ? 'get' : String(metodo).toLowerCase();
    return operaciones.some((op) => op.metodos.has(m) && op.patron.test(ruta));
  };
}

module.exports = { crearBuscadorDeRutas };
