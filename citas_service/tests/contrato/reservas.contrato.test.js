'use strict';

/**
 * Tarea 7.1 — Contrato de reservas (router `reservas`, tarea 3.3 de R).
 * Operaciones: 'crearReserva', 'obtenerReserva', 'listarMisReservas', 'liberarReserva'.
 * Los casos con pago (`409 RESERVA_PAGADA` al liberar) están en pagos.contrato.test.js.
 */
const { crearContexto, describeSiRouter } = require('./apoyo/app');
const { esperarContrato, esperarError } = require('./apoyo/esperar');

const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

describeSiRouter('reservas', 'Reservas', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  describe("'crearReserva' POST /reservas", () => {
    test('web_2 sin token → 201 con Location, expiraEn a 5 minutos y precio de la zona', async () => {
      const res = await ctx.reservar('web_2', { n: 2 });
      esperarContrato('crearReserva', res, 201);
      expect(res.headers.location).toBe(`/api/v1/reservas/${res.body.id}`);
      expect(res.body).toMatchObject({ sitio: 'web_2', estado: 'activa', segundosRestantes: 300, moneda: 'MXN' });
      expect(new Date(res.body.expiraEn) - new Date(res.body.creadaEn)).toBe(300 * 1000);
      expect(res.body.total).toBe(res.body.asientos.reduce((suma, a) => suma + a.precio, 0));
    });

    test('web_1 con token → 201', async () => {
      const res = await ctx.reservar('web_1', { n: 1 });
      esperarContrato('crearReserva', res, 201);
      expect(res.body.sitio).toBe('web_1');
    });

    test('web_1 sin token → 401 NO_AUTENTICADO', async () => {
      const res = await ctx.pedir('post', '/reservas', {
        sitio: 'web_1',
        cuerpo: { funcionId: ctx.datos.web_1.funcionId, asientoIds: ['A1'] },
      });
      esperarError('crearReserva', res, 401, 'NO_AUTENTICADO');
    });

    test('web_1 con token inválido → 401 NO_AUTENTICADO', async () => {
      const res = await ctx.pedir('post', '/reservas', {
        sitio: 'web_1',
        token: 'no-es-un-jwt',
        cuerpo: { funcionId: ctx.datos.web_1.funcionId, asientoIds: ['A1'] },
      });
      esperarError('crearReserva', res, 401, 'NO_AUTENTICADO');
    });

    test.each([
      ['sin asientos', []],
      ['asientos repetidos', ['DUP', 'DUP']],
      ['más de 10 asientos', 11],
    ])('400 SOLICITUD_INVALIDA: %s', async (_, asientos) => {
      const asientoIds = typeof asientos === 'number' ? ctx.datos.web_2.asientoIds.slice(0, asientos) : asientos;
      const res = await ctx.reservar('web_2', { asientoIds });
      esperarError('crearReserva', res, 400, 'SOLICITUD_INVALIDA');
    });

    test('400 SOLICITUD_INVALIDA: falta funcionId', async () => {
      const res = await ctx.pedir('post', '/reservas', { sitio: 'web_2', cuerpo: { asientoIds: ['x'] } });
      esperarError('crearReserva', res, 400, 'SOLICITUD_INVALIDA');
    });

    test('400 SOLICITUD_INVALIDA: JSON mal formado', async () => {
      const res = await ctx.pedir('post', '/reservas', { sitio: 'web_2' }).set('Content-Type', 'application/json').send('{"funcionId":');
      esperarError('crearReserva', res, 400, 'SOLICITUD_INVALIDA');
    });

    test('404 NO_ENCONTRADO: función inexistente o de otro sitio', async () => {
      const nada = await ctx.reservar('web_2', { funcionId: 'no-existe', asientoIds: ['A1'] });
      esperarError('crearReserva', nada, 404, 'NO_ENCONTRADO');
      const otro = await ctx.reservar('web_2', { funcionId: ctx.datos.web_1.funcionId, asientoIds: ['A1'] });
      esperarError('crearReserva', otro, 404, 'NO_ENCONTRADO');
    });

    test('409 ASIENTO_NO_DISPONIBLE con todos los asientos en conflicto y sin apartar ninguno', async () => {
      const [libre, ocupado] = ctx.datos.web_2.asientoIds;
      await ctx.reservaCreada('web_2', { asientoIds: [ocupado] });

      const res = await ctx.reservar('web_2', { asientoIds: [libre, ocupado] });
      esperarError('crearReserva', res, 409, 'ASIENTO_NO_DISPONIBLE', { asientoIds: [ocupado] });

      // El asiento libre sigue disponible: se puede apartar enseguida.
      esperarContrato('crearReserva', await ctx.reservar('web_2', { asientoIds: [libre] }), 201);
    });

    test('422 LIMITE_EXCEDIDO en web_1: 9 asientos + 2 más', async () => {
      const ids = ctx.datos.web_1.asientoIds;
      await ctx.reservaCreada('web_1', { asientoIds: ids.slice(0, 9) });
      const res = await ctx.reservar('web_1', { asientoIds: ids.slice(9, 11) });
      esperarError('crearReserva', res, 422, 'LIMITE_EXCEDIDO', { maximo: 10, actuales: 9, solicitados: 2 });
    });

    test('web_2 no tiene límite por comprador: 10 + 10 asientos → 201', async () => {
      const ids = ctx.datos.web_2.asientoIds;
      await ctx.reservaCreada('web_2', { asientoIds: ids.slice(0, 10) });
      esperarContrato('crearReserva', await ctx.reservar('web_2', { asientoIds: ids.slice(10, 20) }), 201);
    });
  });

  describe("'obtenerReserva' GET /reservas/{reservaId}", () => {
    test.each(['web_1', 'web_2'])('200 en %s con la reserva propia', async (sitio) => {
      const body = await ctx.reservaCreada(sitio);
      const res = await ctx.pedir('get', `/reservas/${body.id}`, ctx.identidad(sitio));
      esperarContrato('obtenerReserva', res, 200);
      expect(res.body.id).toBe(body.id);
    });

    test('estado vencida y segundosRestantes 0 al pasar expiraEn', async () => {
      const body = await ctx.reservaCreada('web_2');
      ctx.avanzar(300);
      const res = await ctx.pedir('get', `/reservas/${body.id}`, { sitio: 'web_2' });
      esperarContrato('obtenerReserva', res, 200);
      expect(res.body).toMatchObject({ estado: 'vencida', segundosRestantes: 0 });
    });

    test('404 si web_1 consulta una reserva de web_2 (escenario del contrato)', async () => {
      const body = await ctx.reservaCreada('web_2');
      const res = await ctx.pedir('get', `/reservas/${body.id}`, ctx.identidad('web_1'));
      esperarError('obtenerReserva', res, 404, 'NO_ENCONTRADO');
    });

    test('404 si la reserva es de otro comprador de web_1', async () => {
      const body = await ctx.reservaCreada('web_1', { compradorId: 'comprador-a' });
      const res = await ctx.pedir('get', `/reservas/${body.id}`, ctx.identidad('web_1', 'comprador-b'));
      esperarError('obtenerReserva', res, 404, 'NO_ENCONTRADO');
    });

    test('404 si no existe', async () => {
      const res = await ctx.pedir('get', `/reservas/${UUID_INEXISTENTE}`, { sitio: 'web_2' });
      esperarError('obtenerReserva', res, 404, 'NO_ENCONTRADO');
    });

    test('401 en web_1 sin token', async () => {
      const body = await ctx.reservaCreada('web_1');
      esperarError('obtenerReserva', await ctx.pedir('get', `/reservas/${body.id}`, { sitio: 'web_1' }), 401, 'NO_AUTENTICADO');
    });
  });

  describe("'listarMisReservas' GET /reservas?estado=activa", () => {
    test('200 en web_1 con sólo las reservas activas y vigentes del comprador', async () => {
      const ids = ctx.datos.web_1.asientoIds;
      await ctx.reservaCreada('web_1', { asientoIds: [ids[0]], compradorId: 'comprador-a' });
      await ctx.reservaCreada('web_1', { asientoIds: [ids[1]], compradorId: 'comprador-b' });

      const res = await ctx.pedir('get', '/reservas', { ...ctx.identidad('web_1', 'comprador-a'), consulta: { estado: 'activa' } });
      esperarContrato('listarMisReservas', res, 200);
      expect(res.body.reservas).toHaveLength(1);
      expect(res.body.reservas[0].asientos[0].asientoId).toBe(ids[0]);

      ctx.avanzar(300);
      const despues = await ctx.pedir('get', '/reservas', ctx.identidad('web_1', 'comprador-a'));
      esperarContrato('listarMisReservas', despues, 200);
      expect(despues.body.reservas).toEqual([]);
    });

    test('401 en web_1 sin token', async () => {
      esperarError('listarMisReservas', await ctx.pedir('get', '/reservas', { sitio: 'web_1' }), 401, 'NO_AUTENTICADO');
    });
  });

  describe("'liberarReserva' DELETE /reservas/{reservaId}", () => {
    test.each(['web_1', 'web_2'])('204 sin cuerpo en %s y los asientos se pueden volver a apartar', async (sitio) => {
      const body = await ctx.reservaCreada(sitio);
      const res = await ctx.pedir('delete', `/reservas/${body.id}`, ctx.identidad(sitio));
      esperarContrato('liberarReserva', res, 204);
      esperarContrato('crearReserva', await ctx.reservar(sitio), 201);
    });

    test('410 RESERVA_LIBERADA si ya se liberó', async () => {
      const body = await ctx.reservaCreada('web_2');
      await ctx.pedir('delete', `/reservas/${body.id}`, { sitio: 'web_2' });
      const res = await ctx.pedir('delete', `/reservas/${body.id}`, { sitio: 'web_2' });
      esperarError('liberarReserva', res, 410, 'RESERVA_LIBERADA');
    });

    test('410 RESERVA_VENCIDA si ya venció, y no la libera (escenario del contrato)', async () => {
      const body = await ctx.reservaCreada('web_2');
      ctx.avanzar(301);
      const res = await ctx.pedir('delete', `/reservas/${body.id}`, { sitio: 'web_2' });
      esperarError('liberarReserva', res, 410, 'RESERVA_VENCIDA');
      const despues = await ctx.pedir('get', `/reservas/${body.id}`, { sitio: 'web_2' });
      expect(despues.body.estado).toBe('vencida');
    });

    test('404 si es de otro sitio o no existe', async () => {
      const body = await ctx.reservaCreada('web_2');
      esperarError('liberarReserva', await ctx.pedir('delete', `/reservas/${body.id}`, ctx.identidad('web_1')), 404, 'NO_ENCONTRADO');
      esperarError('liberarReserva', await ctx.pedir('delete', `/reservas/${UUID_INEXISTENTE}`, { sitio: 'web_2' }), 404, 'NO_ENCONTRADO');
    });

    test('401 en web_1 sin token', async () => {
      const body = await ctx.reservaCreada('web_1');
      esperarError('liberarReserva', await ctx.pedir('delete', `/reservas/${body.id}`, { sitio: 'web_1' }), 401, 'NO_AUTENTICADO');
    });
  });
});
