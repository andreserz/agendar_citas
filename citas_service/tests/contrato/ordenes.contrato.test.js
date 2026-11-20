'use strict';

/**
 * Tarea 7.1 — Contrato de órdenes (router `ordenes`, tarea 3.5 de D).
 * Operaciones: 'listarMisOrdenes', 'obtenerOrden', 'buscarOrden'.
 * Para tener una orden hace falta reservar y pagar, por eso también exige `reservas` y `pagos`.
 */
const { crearContexto, describeSiRouter } = require('./apoyo/app');
const { esperarContrato, esperarError } = require('./apoyo/esperar');

describeSiRouter(['reservas', 'pagos', 'ordenes'], 'Órdenes', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  const comprar = (sitio, compradorId) => ctx.ordenCreada(sitio, compradorId);

  describe("'obtenerOrden' GET /ordenes/{ordenId}", () => {
    test.each(['web_1', 'web_2'])('200 en %s con sus boletos', async (sitio) => {
      const orden = await comprar(sitio);
      const res = await ctx.pedir('get', `/ordenes/${orden.id}`, ctx.identidad(sitio));
      esperarContrato('obtenerOrden', res, 200);
      expect(res.body).toMatchObject({ id: orden.id, folio: orden.folio, sitio });
      expect(res.body.boletos).toHaveLength(2);
    });

    test('404 si es de otro sitio, de otro comprador o no existe', async () => {
      const deWeb2 = await comprar('web_2');
      esperarError('obtenerOrden', await ctx.pedir('get', `/ordenes/${deWeb2.id}`, ctx.identidad('web_1')), 404, 'NO_ENCONTRADO');
      const deA = await comprar('web_1', 'comprador-a');
      esperarError('obtenerOrden', await ctx.pedir('get', `/ordenes/${deA.id}`, ctx.identidad('web_1', 'comprador-b')), 404, 'NO_ENCONTRADO');
      esperarError('obtenerOrden', await ctx.pedir('get', '/ordenes/no-existe', { sitio: 'web_2' }), 404, 'NO_ENCONTRADO');
    });

    test('401 en web_1 sin token', async () => {
      const orden = await comprar('web_1');
      esperarError('obtenerOrden', await ctx.pedir('get', `/ordenes/${orden.id}`, { sitio: 'web_1' }), 401, 'NO_AUTENTICADO');
    });
  });

  describe("'buscarOrden' GET /ordenes/buscar", () => {
    test('200 por folio y por código de boleto (escenario del contrato)', async () => {
      const orden = await comprar('web_2');
      const porFolio = await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_2', consulta: { folio: orden.folio } });
      esperarContrato('buscarOrden', porFolio, 200);
      expect(porFolio.body.id).toBe(orden.id);

      const codigo = orden.boletos[0].codigo;
      const porCodigo = await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_2', consulta: { codigo } });
      esperarContrato('buscarOrden', porCodigo, 200);
      expect(porCodigo.body.id).toBe(orden.id);
    });

    test('400 si no se envía folio ni código, o si se envían los dos', async () => {
      const orden = await comprar('web_2');
      esperarError('buscarOrden', await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_2' }), 400, 'SOLICITUD_INVALIDA');
      const ambos = await ctx.pedir('get', '/ordenes/buscar', {
        sitio: 'web_2',
        consulta: { folio: orden.folio, codigo: orden.boletos[0].codigo },
      });
      esperarError('buscarOrden', ambos, 400, 'SOLICITUD_INVALIDA');
    });

    test('404 si no existe o es de otro sitio', async () => {
      const orden = await comprar('web_2');
      const otro = await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_1', consulta: { folio: orden.folio } });
      esperarError('buscarOrden', otro, 404, 'NO_ENCONTRADO');
      const nada = await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_2', consulta: { folio: 'ORD-999999' } });
      esperarError('buscarOrden', nada, 404, 'NO_ENCONTRADO');
    });
  });

  describe("'listarMisOrdenes' GET /ordenes", () => {
    test('200 en web_1 con sólo las órdenes del comprador', async () => {
      const propia = await comprar('web_1', 'comprador-a');
      await comprar('web_1', 'comprador-b');
      const res = await ctx.pedir('get', '/ordenes', ctx.identidad('web_1', 'comprador-a'));
      esperarContrato('listarMisOrdenes', res, 200);
      expect(res.body.ordenes.map((o) => o.id)).toEqual([propia.id]);
    });

    test('401 en web_1 sin token', async () => {
      esperarError('listarMisOrdenes', await ctx.pedir('get', '/ordenes', { sitio: 'web_1' }), 401, 'NO_AUTENTICADO');
    });
  });
});
