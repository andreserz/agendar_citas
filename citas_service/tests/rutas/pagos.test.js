'use strict';

/**
 * Tarea 7.5 de R: pago simulado por HTTP con reloj fijo.
 * Cubre tarjetas de prueba, atomicidad, doble pago y que nunca se guarden ni devuelvan
 * el número completo ni el CVV.
 */
const { crearContexto, TARJETA_RECHAZADA } = require('../contrato/apoyo/app');

const intentosDelAlmacen = (ctx) => [...ctx.repos.reservasRepo.almacen.intentos.values()];
const ordenesDelAlmacen = (ctx) => [...ctx.repos.ordenesRepo.almacen.ordenes.values()];

describe('7.5 pago simulado', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  test('aprobado: una orden con un boleto por asiento y los asientos quedan comprados', async () => {
    const reserva = await ctx.reservaCreada('web_2', { n: 2 });

    const res = await ctx.pagar('web_2', reserva.id, { cvv: '456' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ resultado: 'aprobado', simulado: true });
    expect(res.body.orden.boletos).toHaveLength(2);
    expect(res.body.reserva).toMatchObject({ estado: 'pagada', ordenId: res.body.orden.id });

    // El asiento ya no se puede volver a apartar.
    const [asiento] = reserva.asientos.map((a) => a.asientoId);
    const otra = await ctx.reservar('web_2', { asientoIds: [asiento] });
    expect(otra.status).toBe(409);
  });

  test('rechazado: se registra el intento, la reserva sigue activa y conserva expiraEn', async () => {
    const reserva = await ctx.reservaCreada('web_2');
    ctx.avanzar(60);

    const res = await ctx.pagar('web_2', reserva.id, { numeroTarjeta: TARJETA_RECHAZADA });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      resultado: 'rechazado',
      reserva: { estado: 'activa', expiraEn: reserva.expiraEn },
    });
    expect(res.body).not.toHaveProperty('orden');
    expect(intentosDelAlmacen(ctx)).toHaveLength(1);

    // Se puede reintentar con la tarjeta aprobada mientras siga vigente.
    const reintento = await ctx.pagar('web_2', reserva.id);
    expect(reintento.body.resultado).toBe('aprobado');
  });

  test('un formato inválido no registra intento ni crea orden', async () => {
    const reserva = await ctx.reservaCreada('web_2');

    const res = await ctx.pagar('web_2', reserva.id, { numeroTarjeta: '5555 5555 5555 4444' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ codigo: 'SOLICITUD_INVALIDA', detalles: { campo: 'numeroTarjeta' } });
    expect(intentosDelAlmacen(ctx)).toHaveLength(0);
    expect(ordenesDelAlmacen(ctx)).toHaveLength(0);
  });

  test('doble pago: 409 y una sola orden e intento aprobado', async () => {
    const reserva = await ctx.reservaCreada('web_2');

    await ctx.pagar('web_2', reserva.id);
    const segundo = await ctx.pagar('web_2', reserva.id);

    expect(segundo.status).toBe(409);
    expect(segundo.body.error.codigo).toBe('RESERVA_PAGADA');
    expect(ordenesDelAlmacen(ctx)).toHaveLength(1);
    expect(intentosDelAlmacen(ctx).filter((i) => i.resultado === 'aprobado')).toHaveLength(1);
  });

  test('ni el almacén ni la respuesta exponen el número completo ni el CVV', async () => {
    const reserva = await ctx.reservaCreada('web_2');
    const res = await ctx.pagar('web_2', reserva.id, { cvv: '987' });

    const respuesta = JSON.stringify(res.body);
    const almacen = JSON.stringify({
      intentos: intentosDelAlmacen(ctx),
      ordenes: ordenesDelAlmacen(ctx),
      reservas: [...ctx.repos.reservasRepo.almacen.reservas.values()],
    });

    for (const texto of [respuesta, almacen]) {
      expect(texto).not.toMatch(/4242 ?4242 ?4242 ?4242/);
      expect(texto).not.toContain('4242424242424242');
      expect(texto).not.toContain('987');
    }
  });

  test('un pago aprobado es atómico: reserva, orden y asientos quedan consistentes', async () => {
    const reserva = await ctx.reservaCreada('web_2', { n: 3 });

    const res = await ctx.pagar('web_2', reserva.id);

    const orden = ordenesDelAlmacen(ctx)[0];
    const guardada = await ctx.pedir('get', `/reservas/${reserva.id}`, { sitio: 'web_2' });
    expect(orden.boletos).toHaveLength(3);
    expect(guardada.body).toMatchObject({ estado: 'pagada', ordenId: orden.id });
    expect(guardada.body.id).toBe(res.body.reserva.id);
  });
});
