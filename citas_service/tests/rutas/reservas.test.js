'use strict';

/**
 * Tareas 7.2, 7.3 y 7.4 de R (dominio de reservas), ejercitadas por HTTP con reloj fijo:
 * - 7.2 expiración a 5 minutos sin esperar.
 * - 7.3 concurrencia: dos apartados simultáneos del mismo asiento (CA-25).
 * - 7.4 límite de 10 en web_1 y sin límite en web_2.
 */
const { crearContexto } = require('../contrato/apoyo/app');

describe('7.2 expiración con reloj fijo', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  test('a los 299 s sigue activa con 1 segundo restante y a los 300 s está vencida', async () => {
    const reserva = await ctx.reservaCreada('web_2');

    ctx.avanzar(299);
    const casi = await ctx.pedir('get', `/reservas/${reserva.id}`, { sitio: 'web_2' });
    expect(casi.body).toMatchObject({ estado: 'activa', segundosRestantes: 1 });

    ctx.avanzar(1);
    const vencida = await ctx.pedir('get', `/reservas/${reserva.id}`, { sitio: 'web_2' });
    expect(vencida.body).toMatchObject({ estado: 'vencida', segundosRestantes: 0 });
  });

  test('al vencer, el asiento vuelve a estar disponible para otro apartado', async () => {
    const [asiento] = ctx.datos.web_2.asientoIds;
    await ctx.reservaCreada('web_2', { asientoIds: [asiento] });

    ctx.avanzar(300);
    const otra = await ctx.reservar('web_2', { asientoIds: [asiento] });
    expect(otra.status).toBe(201);
  });

  test('una reserva vencida no se puede pagar ni liberar', async () => {
    const reserva = await ctx.reservaCreada('web_2');
    ctx.avanzar(301);

    const pago = await ctx.pagar('web_2', reserva.id);
    expect(pago.body.error.codigo).toBe('RESERVA_VENCIDA');

    const liberar = await ctx.pedir('delete', `/reservas/${reserva.id}`, { sitio: 'web_2' });
    expect(liberar.body.error.codigo).toBe('RESERVA_VENCIDA');
  });
});

describe('7.3 concurrencia (CA-25)', () => {
  test('dos apartados simultáneos del mismo asiento: uno gana y el otro recibe 409', async () => {
    const ctx = crearContexto();
    const [asiento] = ctx.datos.web_2.asientoIds;

    const [a, b] = await Promise.all([
      ctx.reservar('web_2', { asientoIds: [asiento] }),
      ctx.reservar('web_2', { asientoIds: [asiento] }),
    ]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
    const perdedor = a.status === 409 ? a : b;
    expect(perdedor.body.error).toMatchObject({
      codigo: 'ASIENTO_NO_DISPONIBLE',
      detalles: { asientoIds: [asiento] },
    });
  });

  test('diez apartados simultáneos de diez asientos distintos: todos entran', async () => {
    const ctx = crearContexto();
    const asientos = ctx.datos.web_2.asientoIds.slice(0, 10);

    const respuestas = await Promise.all(
      asientos.map((asiento) => ctx.reservar('web_2', { asientoIds: [asiento] }))
    );

    expect(respuestas.map((r) => r.status)).toEqual(Array(10).fill(201));
    expect(new Set(respuestas.map((r) => r.body.id)).size).toBe(10);
  });
});

describe('7.4 límite de 10 asientos', () => {
  test('web_1: 10 llegan y el número 11 responde 422 con el detalle del contrato', async () => {
    const ctx = crearContexto();
    const ids = ctx.datos.web_1.asientoIds;

    await ctx.reservaCreada('web_1', { asientoIds: ids.slice(0, 10) });
    const res = await ctx.reservar('web_1', { asientoIds: [ids[10]] });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      codigo: 'LIMITE_EXCEDIDO',
      detalles: { maximo: 10, actuales: 10, solicitados: 1 },
    });
  });

  test('web_1: las reservas vencidas no cuentan para el límite', async () => {
    const ctx = crearContexto();
    const ids = ctx.datos.web_1.asientoIds;

    await ctx.reservaCreada('web_1', { asientoIds: ids.slice(0, 10) });
    ctx.avanzar(300); // la primera reserva vence y deja de contar

    const res = await ctx.reservar('web_1', { asientoIds: ids.slice(10, 20) });
    expect(res.status).toBe(201);
  });

  test('web_2 no tiene límite por comprador: 20 asientos en dos reservas', async () => {
    const ctx = crearContexto();
    const ids = ctx.datos.web_2.asientoIds;

    await ctx.reservaCreada('web_2', { asientoIds: ids.slice(0, 10) });
    const res = await ctx.reservar('web_2', { asientoIds: ids.slice(10, 20) });
    expect(res.status).toBe(201);
  });
});
