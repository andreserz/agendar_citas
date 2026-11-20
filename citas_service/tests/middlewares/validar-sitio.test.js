'use strict';

const express = require('express');
const request = require('supertest');
const { cargarConfig } = require('../../app/config');
const { crearApp } = require('../../app/app');
const { crearValidarSitio } = require('../../app/middlewares/validar-sitio');
const { crearBuscadorDeRutas } = require('../../app/middlewares/rutas-contrato');

// Tarea 2.1 — Requirement: Validación de X-Sitio.

function appDePrueba(opciones) {
  const app = express();
  app.use(crearValidarSitio(opciones));
  app.get('/eventos', (req, res) => res.json({ sitio: req.sitio }));
  app.get('/salud', (req, res) => res.json({ estado: 'ok' }));
  app.use((req, res) => res.status(404).json({ error: { codigo: 'NO_ENCONTRADO' } }));
  return app;
}

describe('validarSitio', () => {
  test.each(['web_1', 'web_2'])('acepta X-Sitio: %s y lo deja en req.sitio', async (sitio) => {
    const res = await request(appDePrueba()).get('/eventos').set('X-Sitio', sitio);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sitio });
  });

  test('sin X-Sitio responde 400 SOLICITUD_INVALIDA con detalles.campo', async () => {
    const res = await request(appDePrueba()).get('/eventos');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: { codigo: 'SOLICITUD_INVALIDA', mensaje: expect.any(String), detalles: { campo: 'X-Sitio' } },
    });
  });

  test.each(['web_3', 'WEB_1', ''])('X-Sitio "%s" no es válido → 400', async (sitio) => {
    const res = await request(appDePrueba()).get('/eventos').set('X-Sitio', sitio);
    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toEqual({ campo: 'X-Sitio' });
  });

  test('GET /salud no requiere X-Sitio', async () => {
    const res = await request(appDePrueba()).get('/salud');
    expect(res.status).toBe(200);
  });

  test('una ruta fuera del contrato no se valida y llega al 404', async () => {
    const app = appDePrueba({ esRutaDelContrato: (metodo, ruta) => ruta === '/eventos' });
    const res = await request(app).get('/otra-ruta');
    expect(res.status).toBe(404);
  });
});

describe('crearBuscadorDeRutas (a partir de openapi.yaml)', () => {
  const esRuta = crearBuscadorDeRutas({
    paths: {
      '/eventos': { get: {} },
      '/eventos/{eventoId}': { get: {} },
      '/reservas/{reservaId}/pago': { post: {} },
    },
  });

  test('reconoce rutas con parámetros y su método', () => {
    expect(esRuta('GET', '/eventos')).toBe(true);
    expect(esRuta('GET', '/eventos/evt-suegra')).toBe(true);
    expect(esRuta('HEAD', '/eventos')).toBe(true);
    expect(esRuta('POST', '/reservas/abc/pago')).toBe(true);
  });

  test('rechaza métodos o rutas que no están en la spec', () => {
    expect(esRuta('DELETE', '/eventos/evt-suegra')).toBe(false);
    expect(esRuta('GET', '/eventos/a/b')).toBe(false);
    expect(esRuta('GET', '/no-existe')).toBe(false);
  });
});

describe('X-Sitio en la app completa', () => {
  const app = crearApp(cargarConfig({ NODE_ENV: 'test' }));

  test('ruta del contrato sin X-Sitio → 400 con detalles.campo = "X-Sitio"', async () => {
    const res = await request(app).get('/api/v1/eventos');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ codigo: 'SOLICITUD_INVALIDA', detalles: { campo: 'X-Sitio' } });
  });

  test('sitio desconocido → 400 (escenario del contrato)', async () => {
    const res = await request(app).get('/api/v1/eventos').set('X-Sitio', 'web_3');
    expect(res.status).toBe(400);
    expect(res.body.error.detalles.campo).toBe('X-Sitio');
  });

  test('ruta fuera del catálogo → 404 NO_ENCONTRADO (escenario del contrato)', async () => {
    const res = await request(app).delete('/api/v1/eventos/evt-suegra').set('X-Sitio', 'web_1');
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
  });

  test('ruta sin versión → 404 NO_ENCONTRADO', async () => {
    const res = await request(app).get('/eventos').set('X-Sitio', 'web_1');
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('NO_ENCONTRADO');
  });
});
