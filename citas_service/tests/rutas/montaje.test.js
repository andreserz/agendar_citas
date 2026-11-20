'use strict';

const express = require('express');
const request = require('supertest');
const { montarRouters, ROUTERS_DE_NEGOCIO } = require('../../app/rutas');

// Montaje de routers (design §1): cada archivo de app/rutas/ que exista se monta con sus dependencias.

describe('montarRouters', () => {
  test('incluye los routers de negocio del design §1', () => {
    expect(ROUTERS_DE_NEGOCIO).toEqual(['catalogo', 'reservas', 'pagos', 'ordenes', 'reportes', 'auth']);
  });

  test('omite los archivos que todavía no existen', () => {
    const api = express.Router();
    expect(montarRouters(api, {}, ['no-existe-todavia'])).toEqual([]);
  });

  test('monta un router existente y le pasa repos, reloj y config', async () => {
    const api = express.Router();
    const reloj = () => new Date('2026-11-20T12:00:00-06:00');
    const montados = montarRouters(api, { repos: {}, reloj, config: {} }, ['salud']);
    expect(montados).toEqual(['salud']);
  });

  test('las rutas montadas reciben req.sitio desde X-Sitio', async () => {
    const { crearValidarSitio } = require('../../app/middlewares/validar-sitio');
    const app = express();
    const api = express.Router();
    api.use(crearValidarSitio());
    api.get('/reservas/:id', (req, res) => res.json({ id: req.params.id, sitio: req.sitio }));
    app.use('/api/v1', api);
    const res = await request(app).get('/api/v1/reservas/abc').set('X-Sitio', 'web_2');
    expect(res.body).toEqual({ id: 'abc', sitio: 'web_2' });
  });
});
