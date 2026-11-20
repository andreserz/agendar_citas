'use strict';

/**
 * Tarea 7.1 — Contrato del pago simulado (router `pagos`, tarea 3.4 de R).
 * Operación: 'pagarReserva'. También cubre `409 RESERVA_PAGADA` de 'liberarReserva'.
 */
const { crearContexto, describeSiRouter, TARJETA_RECHAZADA } = require('./apoyo/app');
const { esperarContrato, esperarError } = require('./apoyo/esperar');

const UUID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

describeSiRouter(['reservas', 'pagos'], "'pagarReserva' POST /reservas/{reservaId}/pago", () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  const reservar = (sitio = 'web_2', opciones) => ctx.reservaCreada(sitio, opciones);

  test.each(['web_1', 'web_2'])('aprobado en %s → 201 con orden, folio, boletos y reserva pagada', async (sitio) => {
    const reserva = await reservar(sitio, { n: 2 });
    const res = await ctx.pagar(sitio, reserva.id);
    esperarContrato('pagarReserva', res, 201);
    expect(res.body).toMatchObject({ resultado: 'aprobado', simulado: true, reserva: { id: reserva.id, estado: 'pagada' } });
    expect(res.body.orden).toMatchObject({ reservaId: reserva.id, sitio, total: reserva.total });
    expect(res.body.orden.boletos).toHaveLength(2);
    expect(res.body.reserva.ordenId).toBe(res.body.orden.id);
  });

  test('rechazado → 201 sin orden, reserva activa y expiraEn sin cambio', async () => {
    const reserva = await reservar();
    ctx.avanzar(60);
    const res = await ctx.pagar('web_2', reserva.id, { numeroTarjeta: TARJETA_RECHAZADA });
    esperarContrato('pagarReserva', res, 201);
    expect(res.body).toMatchObject({ resultado: 'rechazado', simulado: true, reserva: { estado: 'activa', expiraEn: reserva.expiraEn } });
    expect(res.body).not.toHaveProperty('orden');
  });

  test('tras un rechazo se puede reintentar mientras siga vigente', async () => {
    const reserva = await reservar();
    await ctx.pagar('web_2', reserva.id, { numeroTarjeta: TARJETA_RECHAZADA });
    const res = await ctx.pagar('web_2', reserva.id);
    esperarContrato('pagarReserva', res, 201);
    expect(res.body.resultado).toBe('aprobado');
  });

  test.each([
    ['numeroTarjeta', { numeroTarjeta: '5555 5555 5555 4444' }],
    ['titular', { titular: '' }],
    ['vencimiento', { vencimiento: '13/28' }],
    ['vencimiento', { vencimiento: '01/20' }],
    ['cvv', { cvv: '12' }],
  ])('400 SOLICITUD_INVALIDA con detalles.campo = %s', async (campo, cambios) => {
    const reserva = await reservar();
    const res = await ctx.pagar('web_2', reserva.id, cambios);
    esperarError('pagarReserva', res, 400, 'SOLICITUD_INVALIDA', { campo });
    // No se registra intento: la reserva sigue activa y se puede pagar.
    esperarContrato('pagarReserva', await ctx.pagar('web_2', reserva.id), 201);
  });

  test('409 RESERVA_PAGADA al pagar dos veces, con una sola orden', async () => {
    const reserva = await reservar();
    const primero = await ctx.pagar('web_2', reserva.id);
    const res = await ctx.pagar('web_2', reserva.id);
    esperarError('pagarReserva', res, 409, 'RESERVA_PAGADA');
    const consulta = await ctx.pedir('get', `/reservas/${reserva.id}`, { sitio: 'web_2' });
    expect(consulta.body.ordenId).toBe(primero.body.orden.id);
  });

  test("'liberarReserva' 409 RESERVA_PAGADA si ya está pagada", async () => {
    const reserva = await reservar();
    await ctx.pagar('web_2', reserva.id);
    const res = await ctx.pedir('delete', `/reservas/${reserva.id}`, { sitio: 'web_2' });
    esperarError('liberarReserva', res, 409, 'RESERVA_PAGADA');
  });

  test('410 RESERVA_VENCIDA sin cobro', async () => {
    const reserva = await reservar();
    ctx.avanzar(300);
    esperarError('pagarReserva', await ctx.pagar('web_2', reserva.id), 410, 'RESERVA_VENCIDA');
  });

  test('410 RESERVA_LIBERADA', async () => {
    const reserva = await reservar();
    await ctx.pedir('delete', `/reservas/${reserva.id}`, { sitio: 'web_2' });
    esperarError('pagarReserva', await ctx.pagar('web_2', reserva.id), 410, 'RESERVA_LIBERADA');
  });

  test('404 si la reserva es de otro sitio o no existe', async () => {
    const reserva = await reservar('web_2');
    esperarError('pagarReserva', await ctx.pagar('web_1', reserva.id), 404, 'NO_ENCONTRADO');
    esperarError('pagarReserva', await ctx.pagar('web_2', UUID_INEXISTENTE), 404, 'NO_ENCONTRADO');
  });

  test('401 en web_1 sin token', async () => {
    const reserva = await reservar('web_1');
    const res = await ctx.pedir('post', `/reservas/${reserva.id}/pago`, {
      sitio: 'web_1',
      cuerpo: { numeroTarjeta: '4242 4242 4242 4242', titular: 'Ana', vencimiento: '12/28', cvv: '123' },
    });
    esperarError('pagarReserva', res, 401, 'NO_AUTENTICADO');
  });

  test('la respuesta nunca incluye el número completo ni el CVV', async () => {
    const reserva = await reservar();
    const res = await ctx.pagar('web_2', reserva.id, { cvv: '987' });
    esperarContrato('pagarReserva', res, 201);
    const texto = JSON.stringify(res.body);
    expect(texto).not.toMatch(/4242 ?4242 ?4242 ?4242/);
    expect(texto).not.toContain('987');
  });
});
