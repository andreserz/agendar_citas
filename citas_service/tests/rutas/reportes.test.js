'use strict';

/**
 * Router `reportes` (tarea 3.6). Las reservas se crean directo con los repositorios, para no
 * depender del router de reservas (la prueba de contrato con reservas se activa cuando exista).
 */
const { ReportesRepo } = require('../../app/repos/interfaces');
const { crearContexto } = require('../contrato/apoyo/app');
const { esperarContrato } = require('../contrato/apoyo/esperar');

describe('Router reportes', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  let siguiente = 0;
  const reservar = (sitio, ahora) =>
    ctx.repos.reservasRepo.crear({
      sitio,
      compradorId: 'comprador-a',
      funcionId: ctx.datos[sitio].funcionId,
      asientoIds: [ctx.datos[sitio].asientoIds[siguiente++]],
      ahora,
      expiraEn: new Date(ahora.getTime() + 300 * 1000),
      limitePorComprador: sitio === 'web_1' ? 10 : null, // como la API de reservas (RN04)
    });

  test('el repositorio en memoria implementa ReportesRepo', () => {
    expect(ctx.repos.reportesRepo).toBeInstanceOf(ReportesRepo);
    expect(ctx.repos.reportesRepo.contarReservasPorDia).not.toBe(ReportesRepo.prototype.contarReservasPorDia);
  });

  test('cuenta por día de CDMX todas las reservas del sitio, sin importar su estado', async () => {
    // 20 nov 23:30 CDMX = 21 nov 05:30 UTC: cuenta para el 20.
    const tarde = new Date('2026-11-21T05:30:00.000Z');
    const liberada = await reservar('web_2', tarde);
    await ctx.repos.reservasRepo.liberar(liberada.id, tarde);
    await reservar('web_2', tarde); // se queda activa y luego vence
    const pagada = await reservar('web_2', new Date('2026-11-21T06:30:00.000Z')); // 21 nov 00:30 CDMX
    await ctx.repos.ordenesRepo.pagar({ reservaId: pagada.id, ahora: new Date('2026-11-21T06:31:00.000Z') });
    await reservar('web_1', tarde); // otro sitio: no cuenta

    const res = await ctx.pedir('get', '/reportes/reservas-por-dia', {
      sitio: 'web_2',
      consulta: { desde: '2026-11-19', hasta: '2026-11-22' },
    });
    esperarContrato('contarReservasPorDia', res, 200);
    expect(res.body.dias).toEqual([
      { fecha: '2026-11-19', reservas: 0 },
      { fecha: '2026-11-20', reservas: 2 },
      { fecha: '2026-11-21', reservas: 1 },
      { fecha: '2026-11-22', reservas: 0 },
    ]);
  });

  test.each([
    ['hasta antes de desde', { desde: '2026-11-25', hasta: '2026-11-19' }, 'hasta'],
    ['fecha que no existe', { desde: '2026-02-30', hasta: '2026-03-02' }, 'desde'],
    ['93 días', { desde: '2026-10-01', hasta: '2027-01-01' }, 'hasta'],
  ])('400 SOLICITUD_INVALIDA con detalles.campo: %s', async (_, consulta, campo) => {
    const res = await ctx.pedir('get', '/reportes/reservas-por-dia', { sitio: 'web_1', consulta });
    esperarContrato('contarReservasPorDia', res, 400);
    expect(res.body.error).toMatchObject({ codigo: 'SOLICITUD_INVALIDA', detalles: { campo } });
  });

  test('un solo día (desde = hasta) responde un elemento', async () => {
    const res = await ctx.pedir('get', '/reportes/reservas-por-dia', {
      sitio: 'web_1',
      consulta: { desde: '2026-11-20', hasta: '2026-11-20' },
    });
    esperarContrato('contarReservasPorDia', res, 200);
    expect(res.body).toEqual({
      sitio: 'web_1', desde: '2026-11-20', hasta: '2026-11-20', dias: [{ fecha: '2026-11-20', reservas: 0 }],
    });
  });
});
