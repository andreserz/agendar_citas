'use strict';

const express = require('express');
const { ErrorRepositorio, CODIGOS } = require('../repos/errores');
const { aCdmx } = require('../fechas');

/**
 * Órdenes (tarea 3.5): listarMisOrdenes, buscarOrden y obtenerOrden.
 * - `GET /ordenes` sólo para sitios que requieren comprador (web_1), con token.
 * - `GET /ordenes/buscar` recupera una compra sin cuenta por folio o código de boleto.
 * - `GET /ordenes/{ordenId}` «Según sitio»: otra orden de otro sitio o comprador → `404`.
 */
const PATRON_FOLIO = /^ORD-[0-9]{6}$/; // esquema `Folio`
const PATRON_CODIGO = /^[A-Z2-9]{12}$/; // esquema `CodigoBoleto`

/** Orden del repositorio → esquema `Orden` de la API (folio y horas de CDMX). */
function vistaOrden(orden) {
  return {
    id: orden.id,
    folio: orden.numero,
    reservaId: orden.reservaId,
    sitio: orden.sitio,
    fecha: aCdmx(orden.fecha),
    total: orden.total,
    moneda: orden.moneda,
    boletos: orden.boletos.map((b) => ({
      codigo: b.codigo,
      etiqueta: b.etiqueta,
      zonaId: b.zonaId,
      precio: b.precio,
      eventoNombre: b.eventoNombre,
      inicio: aCdmx(b.inicio),
    })),
  };
}

const solicitudInvalida = (mensaje, campo) =>
  new ErrorRepositorio(CODIGOS.SOLICITUD_INVALIDA, mensaje, campo ? { campo } : undefined);
const ordenNoEncontrada = () => new ErrorRepositorio(CODIGOS.NO_ENCONTRADO, 'Orden no encontrada.');

/** Valor de texto de un parámetro de consulta; `undefined` si no viene. Repetido → 400. */
function parametro(req, nombre) {
  const valor = req.query[nombre];
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string') throw solicitudInvalida(`El parámetro ${nombre} no es válido.`, nombre);
  return valor;
}

function crearRouter({ repos, autenticarComprador }) {
  // Se lee al atender cada petición: la app se puede crear sin repositorios (p. ej. sólo /salud).
  const ordenesRepo = () => repos.ordenesRepo;
  const router = express.Router();

  router.get('/ordenes', autenticarComprador, async (req, res) => {
    if (!req.requiereComprador) {
      throw solicitudInvalida('Este sitio no maneja cuentas; usa la búsqueda por folio o código.');
    }
    const ordenes = await ordenesRepo().listarDeComprador(req.compradorId);
    // El repositorio las da de la más antigua a la más reciente; la API, al revés.
    res.json({ ordenes: ordenes.reverse().map(vistaOrden) });
  });

  // Antes de `/ordenes/:ordenId` para que «buscar» no se tome como id.
  router.get('/ordenes/buscar', async (req, res) => {
    const folio = parametro(req, 'folio');
    const codigo = parametro(req, 'codigo');
    if ((folio === undefined) === (codigo === undefined)) {
      throw solicitudInvalida('Envía exactamente uno: folio o código.');
    }
    if (folio !== undefined && !PATRON_FOLIO.test(folio)) {
      throw solicitudInvalida('El folio debe tener el formato ORD-000123.', 'folio');
    }
    if (codigo !== undefined && !PATRON_CODIGO.test(codigo)) {
      throw solicitudInvalida('El código debe tener 12 caracteres.', 'codigo');
    }
    const orden = await ordenesRepo().buscar({ sitio: req.sitio, folio, codigo });
    if (!orden) throw ordenNoEncontrada();
    res.json(vistaOrden(orden));
  });

  router.get('/ordenes/:ordenId', autenticarComprador, async (req, res) => {
    const orden = await ordenesRepo().obtener(req.params.ordenId);
    const esDelSitio = orden && orden.sitio === req.sitio;
    const esDelComprador = orden && (!req.requiereComprador || orden.compradorId === req.compradorId);
    if (!esDelSitio || !esDelComprador) throw ordenNoEncontrada();
    res.json(vistaOrden(orden));
  });

  return router;
}

module.exports = { crearRouter, vistaOrden };
