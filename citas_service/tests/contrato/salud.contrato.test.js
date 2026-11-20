'use strict';

// Tarea 7.1 — Contrato de `GET /salud` (operación 'obtenerSalud').
const { crearContexto } = require('./apoyo/app');
const { esperarContrato } = require('./apoyo/esperar');

describe("'obtenerSalud' GET /salud", () => {
  const ctx = crearContexto();

  test('200 sin X-Sitio y con la forma Salud', async () => {
    const res = await ctx.pedir('get', '/salud');
    esperarContrato('obtenerSalud', res, 200);
    expect(res.body).toEqual({ estado: 'ok', repositorio: 'memoria' });
  });

  test('200 también con X-Sitio', async () => {
    esperarContrato('obtenerSalud', await ctx.pedir('get', '/salud', { sitio: 'web_2' }), 200);
  });
});
