'use strict';

/**
 * Router `ordenes` (tarea 3.5). Las órdenes se crean directo con los repositorios, para no
 * depender de los routers de reservas y pagos (las pruebas de contrato completas están en
 * tests/contrato/ordenes.contrato.test.js y se activan cuando existan esos routers).
 */
const { crearContexto } = require('../contrato/apoyo/app');
const { esperarError } = require('../contrato/apoyo/esperar');

describe('Router ordenes', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  // Igual que la API de reservas: 10 en web_1 y sin límite (null) en web_2 (RN04).
  const limiteDe = (sitio) => (sitio === 'web_1' ? 10 : null);

  let siguiente = 0;
  /** Aparta dos asientos y paga con los repositorios; devuelve la orden del repositorio. */
  async function comprar(sitio, compradorId = sitio === 'web_1' ? 'comprador-a' : 'sin-cuenta') {
    const ahora = ctx.reloj();
    const asientoIds = ctx.datos[sitio].asientoIds.slice(siguiente, siguiente + 2);
    siguiente += 2;
    const reserva = await ctx.repos.reservasRepo.crear({
      sitio,
      compradorId,
      funcionId: ctx.datos[sitio].funcionId,
      asientoIds,
      ahora,
      expiraEn: new Date(ahora.getTime() + 300 * 1000),
      limitePorComprador: limiteDe(sitio),
    });
    const { orden } = await ctx.repos.ordenesRepo.pagar({ reservaId: reserva.id, ahora });
    return orden;
  }

  describe('GET /ordenes/{ordenId}', () => {
    test.each(['web_1', 'web_2'])('200 en %s con folio, boletos y horas de CDMX', async (sitio) => {
      const orden = await comprar(sitio);
      const res = await ctx.pedir('get', `/ordenes/${orden.id}`, ctx.identidad(sitio, 'comprador-a'));
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: orden.id, folio: orden.numero, sitio, total: orden.total, moneda: 'MXN' });
      expect(res.body.fecha).toMatch(/-06:00$/);
      expect(res.body.boletos).toHaveLength(2);
      expect(Object.keys(res.body.boletos[0]).sort()).toEqual(
        ['codigo', 'etiqueta', 'eventoNombre', 'inicio', 'precio', 'zonaId']
      );
      expect(res.body.boletos[0].inicio).toMatch(/-06:00$/);
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

  describe('GET /ordenes/buscar', () => {
    test('200 por folio y por código de boleto, sólo en el sitio de la orden', async () => {
      const orden = await comprar('web_2');
      const porFolio = await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_2', consulta: { folio: orden.numero } });
      expect(porFolio.status).toBe(200);
      expect(porFolio.body.id).toBe(orden.id);
      const porCodigo = await ctx.pedir('get', '/ordenes/buscar', {
        sitio: 'web_2',
        consulta: { codigo: orden.boletos[1].codigo },
      });
      expect(porCodigo.body.id).toBe(orden.id);
      const otroSitio = await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_1', consulta: { folio: orden.numero } });
      esperarError('buscarOrden', otroSitio, 404, 'NO_ENCONTRADO');
    });

    test.each([
      ['ninguno', {}],
      ['los dos', { folio: 'ORD-000001', codigo: 'ABCDEFGHJKLM' }],
      ['folio con otro formato', { folio: '123' }],
      ['código con otro formato', { codigo: 'abc' }],
      ['folio repetido', { folio: ['ORD-000001', 'ORD-000002'] }],
    ])('400 SOLICITUD_INVALIDA: %s', async (_, consulta) => {
      esperarError('buscarOrden', await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_2', consulta }), 400, 'SOLICITUD_INVALIDA');
    });

    test('404 si no existe', async () => {
      const res = await ctx.pedir('get', '/ordenes/buscar', { sitio: 'web_2', consulta: { folio: 'ORD-999999' } });
      esperarError('buscarOrden', res, 404, 'NO_ENCONTRADO');
    });
  });

  describe('GET /ordenes', () => {
    test('200 en web_1 con las órdenes del comprador, de la más reciente a la más antigua', async () => {
      const primera = await comprar('web_1', 'comprador-a');
      await comprar('web_1', 'comprador-b');
      ctx.avanzar(60);
      const segunda = await comprar('web_1', 'comprador-a');
      const res = await ctx.pedir('get', '/ordenes', ctx.identidad('web_1', 'comprador-a'));
      // Forma completa: la valida tests/contrato/ordenes (reservaId UUID depende de la tarea 4.5).
      expect(res.status).toBe(200);
      expect(res.body.ordenes.map((o) => o.id)).toEqual([segunda.id, primera.id]);
    });

    test('401 en web_1 sin token', async () => {
      esperarError('listarMisOrdenes', await ctx.pedir('get', '/ordenes', { sitio: 'web_1' }), 401, 'NO_AUTENTICADO');
    });

    test('400 en web_2, que no maneja cuentas', async () => {
      esperarError('listarMisOrdenes', await ctx.pedir('get', '/ordenes', { sitio: 'web_2' }), 400, 'SOLICITUD_INVALIDA');
    });
  });
});
