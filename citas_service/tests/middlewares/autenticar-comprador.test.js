'use strict';

const express = require('express');
const request = require('supertest');
const { crearAutenticarComprador } = require('../../app/middlewares/autenticar-comprador');
const { crearValidarSitio } = require('../../app/middlewares/validar-sitio');
const { crearManejadorErrores } = require('../../app/middlewares/errores');
const { crearReposEnMemoria } = require('../../app/repos/memoria');
const { emitirToken } = require('../../app/auth/tokens');

// Tarea 2.2 — Requirement: Sitios sin cuenta / Reglas de identidad por sitio.

const SECRETO = 'secreto-solo-para-pruebas';
const AHORA = new Date('2026-11-20T12:00:00-06:00');

function appDePrueba({ sitiosRepo = crearReposEnMemoria().sitiosRepo, reloj = () => AHORA } = {}) {
  const app = express();
  app.use(crearValidarSitio());
  const autenticarComprador = crearAutenticarComprador({ sitiosRepo, jwtSecret: SECRETO, reloj });
  app.post('/reservas', autenticarComprador, (req, res) => {
    res.status(201).json({ compradorId: req.compradorId ?? null, requiereComprador: req.requiereComprador });
  });
  app.use(crearManejadorErrores({ entorno: 'test' }));
  return app;
}

describe('autenticarComprador en web_1 (requiereComprador = true)', () => {
  test('sin Authorization → 401 NO_AUTENTICADO (escenario «web_1 sin token»)', async () => {
    const res = await request(appDePrueba()).post('/reservas').set('X-Sitio', 'web_1');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { codigo: 'NO_AUTENTICADO', mensaje: expect.any(String) } });
  });

  test('con token válido deja req.compradorId', async () => {
    const token = emitirToken('comprador-7', SECRETO, AHORA);
    const res = await request(appDePrueba())
      .post('/reservas')
      .set('X-Sitio', 'web_1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ compradorId: 'comprador-7', requiereComprador: true });
  });

  test.each([
    ['token firmado con otro secreto', () => `Bearer ${emitirToken('c1', 'otro-secreto', AHORA)}`],
    ['token basura', () => 'Bearer abc.def.ghi'],
    ['sin la palabra Bearer', () => emitirToken('c1', SECRETO, AHORA)],
    ['Bearer vacío', () => 'Bearer '],
    ['esquema Basic', () => 'Basic dXN1YXJpbzpjbGF2ZQ=='],
  ])('%s → 401', async (_caso, encabezado) => {
    const res = await request(appDePrueba())
      .post('/reservas')
      .set('X-Sitio', 'web_1')
      .set('Authorization', encabezado());
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('NO_AUTENTICADO');
  });

  test('token vencido (más de 8 horas según el reloj inyectado) → 401', async () => {
    const token = emitirToken('c1', SECRETO, AHORA);
    const nueveHorasDespues = new Date(AHORA.getTime() + 9 * 60 * 60 * 1000);
    const res = await request(appDePrueba({ reloj: () => nueveHorasDespues }))
      .post('/reservas')
      .set('X-Sitio', 'web_1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  test('el 401 usa el mismo mensaje sin importar la causa', async () => {
    const sinToken = await request(appDePrueba()).post('/reservas').set('X-Sitio', 'web_1');
    const malo = await request(appDePrueba())
      .post('/reservas')
      .set('X-Sitio', 'web_1')
      .set('Authorization', 'Bearer abc');
    expect(sinToken.body.error.mensaje).toBe(malo.body.error.mensaje);
  });
});

describe('autenticarComprador en web_2 (requiereComprador = false)', () => {
  test('sin Authorization pasa sin comprador (escenario «web_2 sin token»)', async () => {
    const res = await request(appDePrueba()).post('/reservas').set('X-Sitio', 'web_2');
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ compradorId: null, requiereComprador: false });
  });

  test('nunca exige login: un token inválido se ignora', async () => {
    const res = await request(appDePrueba())
      .post('/reservas')
      .set('X-Sitio', 'web_2')
      .set('Authorization', 'Bearer basura');
    expect(res.status).toBe(201);
    expect(res.body.compradorId).toBeNull();
  });
});

describe('la regla viene del repositorio de sitios', () => {
  test('respeta requiereComprador aunque cambie en el repositorio', async () => {
    const sitiosRepo = { obtener: async (id) => ({ id, nombre: id, requiereComprador: id === 'web_2' }) };
    const app = appDePrueba({ sitiosRepo });
    expect((await request(app).post('/reservas').set('X-Sitio', 'web_1')).status).toBe(201);
    expect((await request(app).post('/reservas').set('X-Sitio', 'web_2')).status).toBe(401);
  });

  test('sitio que no está en el repositorio → 400 con detalles.campo = "X-Sitio"', async () => {
    const app = appDePrueba({ sitiosRepo: { obtener: async () => null } });
    const res = await request(app).post('/reservas').set('X-Sitio', 'web_1');
    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toEqual({ campo: 'X-Sitio' });
  });

  test('si el repositorio falla, responde 500 ERROR_INTERNO', async () => {
    const app = appDePrueba({
      sitiosRepo: {
        obtener: async () => {
          throw new Error('sin conexión');
        },
      },
    });
    const res = await request(app).post('/reservas').set('X-Sitio', 'web_1');
    expect(res.status).toBe(500);
    expect(res.body.error.codigo).toBe('ERROR_INTERNO');
  });
});
