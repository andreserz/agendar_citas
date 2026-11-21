'use strict';

const express = require('express');
const { ErrorRepositorio, CODIGOS } = require('../repos/errores');
const { leerDia, textoDia } = require('../fechas');

/**
 * Reportes (tarea 3.6): `GET /reportes/reservas-por-dia` (contarReservasPorDia).
 * Reservas creadas por día en CDMX, sin importar su estado, sólo del sitio de `X-Sitio`.
 * `desde` y `hasta` son obligatorios (AAAA-MM-DD, inclusive) y el rango es de 92 días como máximo.
 * La respuesta trae un elemento por cada día del rango, con 0 si no hubo reservas.
 */
const MAX_DIAS = 92;

const solicitudInvalida = (mensaje, campo) =>
  new ErrorRepositorio(CODIGOS.SOLICITUD_INVALIDA, mensaje, { campo });

function leerParametroDia(req, nombre) {
  const dia = leerDia(req.query[nombre]);
  if (dia === null) throw solicitudInvalida(`El parámetro ${nombre} debe ser una fecha AAAA-MM-DD.`, nombre);
  return dia;
}

function crearRouter({ repos }) {
  // Se lee al atender cada petición: la app se puede crear sin repositorios (p. ej. sólo /salud).
  const reportesRepo = () => repos.reportesRepo;
  const router = express.Router();

  router.get('/reportes/reservas-por-dia', async (req, res) => {
    const desde = leerParametroDia(req, 'desde');
    const hasta = leerParametroDia(req, 'hasta');
    if (hasta < desde) throw solicitudInvalida('hasta no puede ser anterior a desde.', 'hasta');
    if (hasta - desde + 1 > MAX_DIAS) {
      throw solicitudInvalida(`El rango no puede ser mayor a ${MAX_DIAS} días.`, 'hasta');
    }

    const contados = await reportesRepo().contarReservasPorDia({
      sitio: req.sitio,
      desde: textoDia(desde),
      hasta: textoDia(hasta),
    });
    const porFecha = new Map(contados.map((d) => [d.fecha, d.reservas]));
    const dias = [];
    for (let dia = desde; dia <= hasta; dia += 1) {
      const fecha = textoDia(dia);
      dias.push({ fecha, reservas: porFecha.get(fecha) || 0 });
    }
    res.json({ sitio: req.sitio, desde: textoDia(desde), hasta: textoDia(hasta), dias });
  });

  return router;
}

module.exports = { crearRouter };
