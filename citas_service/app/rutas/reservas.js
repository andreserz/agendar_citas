'use strict';

const express = require('express');

const { CODIGOS, ErrorRepositorio } = require('../repos/errores');
const { ServicioReservas } = require('../dominio/reservas');

/**
 * Router de reservas (tarea 3.3 de R).
 *
 * Operaciones del contrato (`openapi.yaml`):
 * - `POST   /reservas`               `crearReserva`       «Según sitio» (web_1 exige token).
 * - `GET    /reservas/{id}`          `obtenerReserva`     «Según sitio».
 * - `GET    /reservas?estado=activa` `listarMisReservas`  solo web_1.
 * - `DELETE /reservas/{id}`          `liberarReserva`     «Según sitio».
 *
 * Las reglas (5 minutos, límite de 10, propiedad, vencimiento) viven en `ServicioReservas`
 * y en los repositorios; aquí sólo se traduce HTTP ↔ dominio (design §1).
 */

// CDMX es UTC−6 todo el año (D13): las fechas viajan con desplazamiento explícito.
const OFFSET_CDMX_MINUTOS = -6 * 60;

/** `Date` → ISO 8601 con desplazamiento `-06:00`, como pide el contrato. */
function fechaCdmx(valor) {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  const local = new Date(fecha.getTime() + OFFSET_CDMX_MINUTOS * 60 * 1000);
  return `${local.toISOString().slice(0, 19)}-06:00`;
}

/**
 * Forma `Reserva` del contrato: sólo los campos documentados, sin `compradorId` ni nulos de
 * campos opcionales, y las fechas con desplazamiento de CDMX.
 */
function reservaJson(reserva) {
  const vista = {
    id: reserva.id,
    sitio: reserva.sitio,
    funcionId: reserva.funcionId,
    estado: reserva.estado,
    asientos: reserva.asientos.map(({ asientoId, etiqueta, zonaId, precio }) => ({
      asientoId,
      etiqueta,
      zonaId,
      precio,
    })),
    total: reserva.total,
    moneda: reserva.moneda,
    creadaEn: fechaCdmx(reserva.creadaEn),
    expiraEn: fechaCdmx(reserva.expiraEn),
    segundosRestantes: reserva.segundosRestantes,
  };
  if (reserva.ordenId) vista.ordenId = reserva.ordenId;
  return vista;
}

function solicitudInvalida(mensaje, detalles) {
  return new ErrorRepositorio(CODIGOS.SOLICITUD_INVALIDA, mensaje, detalles);
}

/**
 * Una función de otro sitio se comporta como inexistente (contrato: `404`, no `400`).
 * Se valida en la capa HTTP porque depende de `X-Sitio` (RN09).
 */
async function exigirFuncionDelSitio(repos, funcionId, sitio) {
  if (!repos || !repos.asientosRepo || typeof repos.asientosRepo.obtenerFuncion !== 'function') return;
  const funcion = await repos.asientosRepo.obtenerFuncion(funcionId);
  if (!funcion) return; // El repositorio de reservas responde NO_ENCONTRADO.
  const evento = await repos.asientosRepo.obtenerEvento(funcion.eventoId);
  if (!evento || evento.sitio !== sitio) {
    throw new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, 'Función no encontrada.');
  }
}

function crearRouter({ repos, reloj, config, autenticarComprador }) {
  const router = express.Router();
  // El dominio espera un reloj con `ahora()`; la app inyecta una función (ADR-003).
  // Se construye por petición para que montar la app no exija repositorios (hay pruebas
  // que sólo verifican 404, CORS o X-Sitio sin inyectarlos).
  const servicio = () => new ServicioReservas({ repos, reloj: { ahora: () => reloj() } });
  const rutaBase = config.rutaBase;

  // POST /reservas — `crearReserva`
  router.post('/reservas', autenticarComprador, async (req, res, next) => {
    try {
      const { funcionId, asientoIds } = req.body || {};
      if (typeof funcionId !== 'string' || funcionId.trim() === '') {
        throw solicitudInvalida('Falta funcionId.', { campo: 'funcionId' });
      }
      await exigirFuncionDelSitio(repos, funcionId, req.sitio);

      const reserva = await servicio().apartar({
        sitio: req.sitio,
        compradorId: req.compradorId,
        funcionId,
        asientoIds,
      });

      return res
        .status(201)
        .location(`${rutaBase}/reservas/${reserva.id}`)
        .json(reservaJson(reserva));
    } catch (err) {
      return next(err);
    }
  });

  // GET /reservas?estado=activa — `listarMisReservas`
  router.get('/reservas', autenticarComprador, async (req, res, next) => {
    try {
      const { estado } = req.query;
      if (estado !== undefined && estado !== 'activa') {
        throw solicitudInvalida('El único estado soportado es «activa».', { campo: 'estado' });
      }

      const reservas = await servicio().listarActivas(req.compradorId);
      return res.json({ reservas: reservas.map(reservaJson) });
    } catch (err) {
      return next(err);
    }
  });

  // GET /reservas/{reservaId} — `obtenerReserva`
  router.get('/reservas/:reservaId', autenticarComprador, async (req, res, next) => {
    try {
      const reserva = await servicio().obtener(req.params.reservaId, {
        compradorId: req.compradorId,
        sitio: req.sitio,
      });
      return res.json(reservaJson(reserva));
    } catch (err) {
      return next(err);
    }
  });

  // DELETE /reservas/{reservaId} — `liberarReserva`
  router.delete('/reservas/:reservaId', autenticarComprador, async (req, res, next) => {
    try {
      await servicio().liberar(req.params.reservaId, req.compradorId, { sitio: req.sitio });
      return res.status(204).end();
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { crearRouter, fechaCdmx, reservaJson };
