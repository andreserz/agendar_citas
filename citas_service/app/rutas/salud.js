'use strict';

const express = require('express');

/**
 * `GET /api/v1/salud` (operación `obtenerSalud`). No requiere `X-Sitio`.
 * Responde el esquema `Salud`: `{ estado: "ok", repositorio: "memoria" | "sql" }`.
 */
function crearRouter({ config }) {
  const router = express.Router();
  router.get('/salud', (req, res) => {
    res.json({ estado: 'ok', repositorio: config.repositorio });
  });
  return router;
}

module.exports = { crearRouter };
