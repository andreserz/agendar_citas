'use strict';

const request = require('supertest');
const { cargarConfig } = require('../../app/config');
const { crearApp } = require('../../app/app');

// Tarea 3.1 — GET /api/v1/salud (esquema `Salud`, sin `X-Sitio`).

describe('GET /api/v1/salud', () => {
  test('responde 200 sin X-Sitio (escenario «Salud sin sitio»)', async () => {
    const app = crearApp(cargarConfig({ NODE_ENV: 'test' }));
    const res = await request(app).get('/api/v1/salud');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ estado: 'ok', repositorio: 'memoria' });
  });

  test('informa el repositorio configurado', async () => {
    const app = crearApp(cargarConfig({ NODE_ENV: 'test', REPOSITORIO: 'sql' }));
    const res = await request(app).get('/api/v1/salud').set('X-Sitio', 'web_2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ estado: 'ok', repositorio: 'sql' });
  });
});
