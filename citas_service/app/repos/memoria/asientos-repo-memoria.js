'use strict';

const { AsientosRepo } = require('../interfaces');
const { CODIGOS, ErrorRepositorio } = require('../errores');
const { clave, estadoAsiento, exigirFecha } = require('./almacen');

class AsientosRepoMemoria extends AsientosRepo {
  constructor(almacen) {
    super();
    this.almacen = almacen;
  }

  async listarEventos({ sitio } = {}) {
    return [...this.almacen.eventos.values()]
      .filter((e) => e.activo && (sitio === undefined || e.sitio === sitio))
      .map(vistaEvento);
  }

  async obtenerEvento(eventoId) {
    const evento = this.almacen.eventos.get(eventoId);
    return evento && evento.activo ? vistaEvento(evento) : null;
  }

  async listarFunciones(eventoId) {
    const evento = this.almacen.eventos.get(eventoId);
    if (!evento || !evento.activo) {
      throw new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, 'Evento no encontrado.');
    }
    return [...this.almacen.funciones.values()]
      .filter((f) => f.activa && f.eventoId === eventoId)
      .sort((a, b) => a.inicio - b.inicio)
      .map(vistaFuncion);
  }

  async obtenerFuncion(funcionId) {
    const funcion = this.almacen.funciones.get(funcionId);
    return funcion && funcion.activa ? vistaFuncion(funcion) : null;
  }

  async listarZonas(funcionId) {
    return this.#zonasDeFuncion(funcionId).map((zona) => ({
      id: zona.id,
      nombre: zona.nombre,
      precio: this.almacen.precios.get(clave(funcionId, zona.id)),
      moneda: zona.moneda,
    }));
  }

  async listarAsientos(funcionId, ahora) {
    exigirFecha(ahora, 'ahora');
    const zonasDeFuncion = new Set(this.#zonasDeFuncion(funcionId).map((z) => z.id));
    return [...this.almacen.asientos.values()]
      .filter((a) => a.activo && zonasDeFuncion.has(a.zonaId))
      .map((a) => ({
        id: a.id,
        zonaId: a.zonaId,
        fila: a.fila,
        numero: a.numero,
        etiqueta: a.etiqueta,
        precio: this.almacen.precios.get(clave(funcionId, a.zonaId)),
        estado: estadoAsiento(this.almacen, funcionId, a.id, ahora),
      }));
  }

  #funcionYSitio(funcionId) {
    const funcion = this.almacen.funciones.get(funcionId);
    if (!funcion || !funcion.activa) {
      throw new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, 'Función no encontrada.');
    }
    return { funcion, sitio: this.almacen.eventos.get(funcion.eventoId).sitio };
  }

  /**
   * Zonas del sitio que tienen precio en la función. En web_1 son las 3 zonas; en web_2
   * sólo la sala de la función, igual que `AsientosFuncion` en el backend.
   */
  #zonasDeFuncion(funcionId) {
    const { sitio } = this.#funcionYSitio(funcionId);
    return [...this.almacen.zonas.values()].filter(
      (z) => z.sitio === sitio && this.almacen.precios.has(clave(funcionId, z.id))
    );
  }
}

function vistaEvento({ id, sitio, nombre, descripcion, recinto }) {
  const evento = { id, sitio, nombre };
  if (descripcion !== undefined) evento.descripcion = descripcion;
  if (recinto !== undefined) evento.recinto = recinto;
  return evento;
}

// Campos opcionales de la función; web_1 no los tiene y no se incluyen.
const CAMPOS_OPCIONALES_FUNCION = ['formato', 'idioma', 'clasificacion', 'duracionMinutos'];

function vistaFuncion(funcion) {
  const vista = { id: funcion.id, eventoId: funcion.eventoId, inicio: new Date(funcion.inicio) };
  for (const campo of CAMPOS_OPCIONALES_FUNCION) {
    if (funcion[campo] !== undefined && funcion[campo] !== null) vista[campo] = funcion[campo];
  }
  return vista;
}

module.exports = { AsientosRepoMemoria };
