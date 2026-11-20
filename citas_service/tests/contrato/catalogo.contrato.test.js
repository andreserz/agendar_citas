'use strict';

/**
 * Tarea 7.1 — Contrato del catálogo (router `catalogo`, tarea 3.2 de D).
 * Operaciones: 'listarEventos', 'obtenerEvento', 'listarFunciones', 'obtenerFuncion', 'listarAsientos'.
 */
const { crearContexto, describeSiRouter } = require('./apoyo/app');
const { esperarContrato, esperarError } = require('./apoyo/esperar');

const CDMX = /-06:00$/;

describeSiRouter('catalogo', 'Catálogo', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  describe("'listarEventos' GET /eventos", () => {
    test.each(['web_1', 'web_2'])('200 sólo con los eventos de %s', async (sitio) => {
      const res = await ctx.pedir('get', '/eventos', { sitio });
      esperarContrato('listarEventos', res, 200);
      expect(res.body.eventos.length).toBeGreaterThan(0);
      expect(res.body.eventos.every((e) => e.sitio === sitio)).toBe(true);
      expect(res.body.eventos.map((e) => e.id)).toContain(ctx.datos[sitio].eventoId);
    });
  });

  describe("'obtenerEvento' GET /eventos/{eventoId}", () => {
    test('200 con el evento del sitio', async () => {
      const res = await ctx.pedir('get', `/eventos/${ctx.datos.web_1.eventoId}`, { sitio: 'web_1' });
      esperarContrato('obtenerEvento', res, 200);
      expect(res.body).toMatchObject({ id: 'evt-suegra', sitio: 'web_1' });
    });

    test('404 si el evento es de otro sitio', async () => {
      const res = await ctx.pedir('get', `/eventos/${ctx.datos.web_2.eventoId}`, { sitio: 'web_1' });
      esperarError('obtenerEvento', res, 404, 'NO_ENCONTRADO');
    });

    test('404 si no existe', async () => {
      esperarError('obtenerEvento', await ctx.pedir('get', '/eventos/no-existe', { sitio: 'web_1' }), 404, 'NO_ENCONTRADO');
    });
  });

  describe("'listarFunciones' GET /eventos/{eventoId}/funciones", () => {
    test.each(['web_1', 'web_2'])('200 en %s, ordenadas por inicio y con hora de CDMX', async (sitio) => {
      const res = await ctx.pedir('get', `/eventos/${ctx.datos[sitio].eventoId}/funciones`, { sitio });
      esperarContrato('listarFunciones', res, 200);
      const inicios = res.body.funciones.map((f) => f.inicio);
      expect(inicios.length).toBeGreaterThan(0);
      expect(inicios.every((i) => CDMX.test(i))).toBe(true);
      expect([...inicios].sort((a, b) => new Date(a) - new Date(b))).toEqual(inicios);
    });

    test('404 si el evento no existe o es de otro sitio', async () => {
      const otro = await ctx.pedir('get', `/eventos/${ctx.datos.web_1.eventoId}/funciones`, { sitio: 'web_2' });
      esperarError('listarFunciones', otro, 404, 'NO_ENCONTRADO');
      const nada = await ctx.pedir('get', '/eventos/no-existe/funciones', { sitio: 'web_2' });
      esperarError('listarFunciones', nada, 404, 'NO_ENCONTRADO');
    });
  });

  describe("'obtenerFuncion' GET /funciones/{funcionId}", () => {
    test.each(['web_1', 'web_2'])('200 en %s con zonas y precios en MXN', async (sitio) => {
      const res = await ctx.pedir('get', `/funciones/${ctx.datos[sitio].funcionId}`, { sitio });
      esperarContrato('obtenerFuncion', res, 200);
      expect(res.body.id).toBe(ctx.datos[sitio].funcionId);
      expect(res.body.zonas.length).toBeGreaterThan(0);
      expect(res.body.inicio).toMatch(CDMX);
    });

    test('404 si la función es de otro sitio o no existe', async () => {
      const otro = await ctx.pedir('get', `/funciones/${ctx.datos.web_2.funcionId}`, { sitio: 'web_1' });
      esperarError('obtenerFuncion', otro, 404, 'NO_ENCONTRADO');
      esperarError('obtenerFuncion', await ctx.pedir('get', '/funciones/no-existe', { sitio: 'web_1' }), 404, 'NO_ENCONTRADO');
    });
  });

  describe("'listarAsientos' GET /funciones/{funcionId}/asientos", () => {
    test.each(['web_1', 'web_2'])('200 en %s con el mapa completo y todo disponible al inicio', async (sitio) => {
      const res = await ctx.pedir('get', `/funciones/${ctx.datos[sitio].funcionId}/asientos`, { sitio });
      esperarContrato('listarAsientos', res, 200);
      expect(res.body.asientos).toHaveLength(ctx.datos[sitio].asientoIds.length);
      expect(res.body.asientos.every((a) => a.estado === 'disponible')).toBe(true);
      expect(res.body.consultadoEn).toMatch(CDMX);
    });

    test('no revela quién aparta: el asiento sólo trae los campos de la spec', async () => {
      const res = await ctx.pedir('get', `/funciones/${ctx.datos.web_1.funcionId}/asientos`, { sitio: 'web_1' });
      const campos = ['id', 'zonaId', 'fila', 'numero', 'etiqueta', 'precio', 'estado'];
      expect(res.body.asientos.every((a) => Object.keys(a).every((c) => campos.includes(c)))).toBe(true);
    });

    test('404 si la función es de otro sitio o no existe', async () => {
      const otro = await ctx.pedir('get', `/funciones/${ctx.datos.web_1.funcionId}/asientos`, { sitio: 'web_2' });
      esperarError('listarAsientos', otro, 404, 'NO_ENCONTRADO');
      const nada = await ctx.pedir('get', '/funciones/no-existe/asientos', { sitio: 'web_2' });
      esperarError('listarAsientos', nada, 404, 'NO_ENCONTRADO');
    });
  });
});

describeSiRouter(['catalogo', 'reservas'], 'Catálogo con reservas (estado del asiento)', () => {
  test("'listarAsientos': apartado mientras la reserva está vigente y disponible en expiraEn", async () => {
    const ctx = crearContexto();
    const [asientoId] = ctx.datos.web_2.asientoIds;
    await ctx.reservaCreada('web_2', { asientoIds: [asientoId] });

    const estado = async () => {
      const res = await ctx.pedir('get', `/funciones/${ctx.datos.web_2.funcionId}/asientos`, { sitio: 'web_2' });
      esperarContrato('listarAsientos', res, 200);
      return res.body.asientos.find((a) => a.id === asientoId).estado;
    };

    expect(await estado()).toBe('apartado');
    ctx.avanzar(300); // ahora = expiraEn: la comparación es estricta
    expect(await estado()).toBe('disponible');
  });
});
