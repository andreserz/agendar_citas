'use strict';

const request = require('supertest');
const { cargarConfig } = require('../app/config');
const { crearApp } = require('../app/app');

const app = crearApp(cargarConfig({ NODE_ENV: 'test' }));

describe('Swagger UI', () => {
  test('GET /docs/ muestra la documentación', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toMatch(/swagger/i);
  });
});

describe('CORS (PR9)', () => {
  test.each([
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:5502',
    'http://127.0.0.1:5502',
  ])('permite el origen %s', async (origen) => {
    const res = await request(app)
      .options('/api/v1/eventos')
      .set('Origin', origen)
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(origen);
  });

  test('no permite un origen desconocido', async () => {
    const res = await request(app).get('/api/v1/eventos').set('Origin', 'http://malicioso.test');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Errores con el formato de la spec', () => {
  test('una ruta inexistente responde 404 NO_ENCONTRADO', async () => {
    const res = await request(app).get('/api/v1/no-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { codigo: 'NO_ENCONTRADO', mensaje: expect.any(String) },
    });
  });

  test('un JSON mal formado responde 400 SOLICITUD_INVALIDA', async () => {
    const res = await request(app)
      .post('/api/v1/reservas')
      .set('Content-Type', 'application/json')
      .send('{"mal":');
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('SOLICITUD_INVALIDA');
  });

  test('no expone el encabezado X-Powered-By', async () => {
    const res = await request(app).get('/api/v1/no-existe');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
