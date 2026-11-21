'use strict';

const express = require('express');
const { ErrorRepositorio, CODIGOS } = require('../repos/errores');
const { aCdmx } = require('../fechas');

/**
 * Catálogo (tarea 3.2): eventos, funciones y mapa de asientos del sitio de `X-Sitio`.
 * Operaciones: listarEventos, obtenerEvento, listarFunciones, obtenerFuncion, listarAsientos.
 * No requieren comprador. Un evento o una función de otro sitio responde `404` (no se revela).
 */
function crearRouter({ repos, reloj }) {
  // Se leen al atender cada petición: la app se puede crear sin repositorios (p. ej. sólo /salud).
  const asientosRepo = () => repos.asientosRepo;
  const router = express.Router();

  const noEncontrado = (que) => new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, `${que} no encontrado.`);

  /** Evento del sitio o `404`. */
  async function eventoDelSitio(eventoId, sitio) {
    const evento = await asientosRepo().obtenerEvento(eventoId);
    if (!evento || evento.sitio !== sitio) throw noEncontrado('Evento');
    return evento;
  }

  /** Función del sitio (su evento es del sitio) o `404`. */
  async function funcionDelSitio(funcionId, sitio) {
    const funcion = await asientosRepo().obtenerFuncion(funcionId);
    const evento = funcion && (await asientosRepo().obtenerEvento(funcion.eventoId));
    if (!evento || evento.sitio !== sitio) throw noEncontrado('Función');
    return funcion;
  }

  /** Esquema `Funcion`: hora de CDMX y zonas con su precio. */
  async function vistaFuncion(funcion) {
    const zonas = await asientosRepo().listarZonas(funcion.id);
    return { ...funcion, inicio: aCdmx(funcion.inicio), zonas };
  }

  router.get('/eventos', async (req, res) => {
    const eventos = await asientosRepo().listarEventos({ sitio: req.sitio });
    res.json({ eventos });
  });

  router.get('/eventos/:eventoId', async (req, res) => {
    res.json(await eventoDelSitio(req.params.eventoId, req.sitio));
  });

  router.get('/eventos/:eventoId/funciones', async (req, res) => {
    await eventoDelSitio(req.params.eventoId, req.sitio);
    const funciones = await asientosRepo().listarFunciones(req.params.eventoId);
    res.json({ funciones: await Promise.all(funciones.map(vistaFuncion)) });
  });

  router.get('/funciones/:funcionId', async (req, res) => {
    const funcion = await funcionDelSitio(req.params.funcionId, req.sitio);
    res.json(await vistaFuncion(funcion));
  });

  router.get('/funciones/:funcionId/asientos', async (req, res) => {
    const funcion = await vistaFuncion(await funcionDelSitio(req.params.funcionId, req.sitio));
    const ahora = reloj();
    const asientos = await asientosRepo().listarAsientos(funcion.id, ahora);
    res.json({ funcion, zonas: funcion.zonas, asientos, consultadoEn: aCdmx(ahora) });
  });

  return router;
}

module.exports = { crearRouter };
