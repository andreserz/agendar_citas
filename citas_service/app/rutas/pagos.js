'use strict';

const express = require('express');

const { ServicioReservas } = require('../dominio/reservas');
const { fechaCdmx, reservaJson } = require('./reservas');

/**
 * Router de pagos (tarea 3.4 de R).
 *
 * Operación del contrato: `POST /reservas/{reservaId}/pago` (`pagarReserva`), «Según sitio».
 * El resultado lo decide la tarjeta de prueba (D14); el dominio hace el pago atómico con el
 * repositorio de órdenes y nunca guarda el número completo ni el CVV.
 */

/** Forma `Orden` del contrato: `numero` del repositorio → `folio`, fechas con `-06:00`. */
function ordenJson(orden) {
  return {
    id: orden.id,
    folio: orden.numero,
    reservaId: orden.reservaId,
    sitio: orden.sitio,
    fecha: fechaCdmx(orden.fecha),
    total: orden.total,
    moneda: orden.moneda,
    boletos: orden.boletos.map(({ codigo, etiqueta, zonaId, precio, eventoNombre, inicio }) => ({
      codigo,
      etiqueta,
      zonaId,
      precio,
      eventoNombre,
      inicio: fechaCdmx(inicio),
    })),
  };
}

/** Forma `Pago` del contrato: sólo los campos documentados (`orden` solo si se aprobó). */
function pagoJson(pago) {
  const cuerpo = {
    resultado: pago.resultado,
    simulado: true,
    reserva: reservaJson(pago.reserva),
  };
  if (pago.orden) cuerpo.orden = ordenJson(pago.orden);
  return cuerpo;
}

function crearRouter({ repos, reloj, autenticarComprador }) {
  const router = express.Router();
  // Igual que en reservas: se construye por petición para no exigir repositorios al montar.
  const servicio = () => new ServicioReservas({ repos, reloj: { ahora: () => reloj() } });

  // POST /reservas/{reservaId}/pago — `pagarReserva`
  router.post('/reservas/:reservaId/pago', autenticarComprador, async (req, res, next) => {
    try {
      const pago = await servicio().pagar(req.params.reservaId, req.body || {}, {
        compradorId: req.compradorId,
        sitio: req.sitio,
      });
      return res.status(201).json(pagoJson(pago));
    } catch (err) {
      return next(err);
    }
  });

  return router;
}

module.exports = { crearRouter, pagoJson, ordenJson };
