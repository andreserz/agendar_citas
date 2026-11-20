'use strict';

/**
 * Tarea 7.1 — Contrato del reporte diario (router `reportes`, tarea 3.6 de D).
 * Operación: 'contarReservasPorDia'.
 */
const { crearContexto, describeSiRouter } = require('./apoyo/app');
const { esperarContrato, esperarError } = require('./apoyo/esperar');

describeSiRouter('reportes', "'contarReservasPorDia' GET /reportes/reservas-por-dia", () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  const contar = (consulta, sitio = 'web_2') => ctx.pedir('get', '/reportes/reservas-por-dia', { sitio, consulta });

  test('200 con un elemento por día del rango, inclusive', async () => {
    const res = await contar({ desde: '2026-11-19', hasta: '2026-11-25' });
    esperarContrato('contarReservasPorDia', res, 200);
    expect(res.body).toMatchObject({ sitio: 'web_2', desde: '2026-11-19', hasta: '2026-11-25' });
    expect(res.body.dias.map((d) => d.fecha)).toEqual([
      '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25',
    ]);
  });

  test('acepta exactamente 92 días', async () => {
    esperarContrato('contarReservasPorDia', await contar({ desde: '2026-10-01', hasta: '2026-12-31' }), 200);
  });

  test.each([
    ['rango de más de 92 días', { desde: '2026-10-01', hasta: '2027-01-01' }],
    ['falta desde', { hasta: '2026-11-25' }],
    ['falta hasta', { desde: '2026-11-19' }],
    ['fecha con formato inválido', { desde: '19/11/2026', hasta: '2026-11-25' }],
  ])('400 SOLICITUD_INVALIDA: %s', async (_, consulta) => {
    esperarError('contarReservasPorDia', await contar(consulta), 400, 'SOLICITUD_INVALIDA');
  });
});

describeSiRouter(['reportes', 'reservas'], 'Reporte diario con reservas', () => {
  test("'contarReservasPorDia' cuenta reservas creadas sin importar su estado y sólo del sitio", async () => {
    const ctx = crearContexto();
    const ids = ctx.datos.web_2.asientoIds;
    const a = await ctx.reservaCreada('web_2', { asientoIds: [ids[0]] });
    await ctx.reservaCreada('web_2', { asientoIds: [ids[1]] });
    expect((await ctx.pedir('delete', `/reservas/${a.id}`, { sitio: 'web_2' })).status).toBe(204);
    await ctx.reservaCreada('web_1');
    ctx.avanzar(600); // la segunda vence

    const res = await ctx.pedir('get', '/reportes/reservas-por-dia', {
      sitio: 'web_2',
      consulta: { desde: '2026-11-20', hasta: '2026-11-20' },
    });
    esperarContrato('contarReservasPorDia', res, 200);
    expect(res.body.dias).toEqual([{ fecha: '2026-11-20', reservas: 2 }]);
  });
});
