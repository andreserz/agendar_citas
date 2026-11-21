'use strict';

/**
 * Router `catalogo` (tarea 3.2): casos que no cubre tests/contrato/catalogo mientras no exista
 * el router de reservas. Las reservas se crean directo con el repositorio.
 */
const { crearContexto } = require('../contrato/apoyo/app');
const { esperarContrato } = require('../contrato/apoyo/esperar');

describe('Router catalogo', () => {
  let ctx;
  beforeEach(() => {
    ctx = crearContexto();
  });

  const mapa = async (sitio) => {
    const res = await ctx.pedir('get', `/funciones/${ctx.datos[sitio].funcionId}/asientos`, { sitio });
    esperarContrato('listarAsientos', res, 200);
    return res.body;
  };

  test('asiento apartado mientras la reserva está vigente y disponible en expiraEn', async () => {
    const [asientoId] = ctx.datos.web_2.asientoIds;
    const ahora = ctx.reloj();
    await ctx.repos.reservasRepo.crear({
      sitio: 'web_2',
      compradorId: 'sin-cuenta',
      funcionId: ctx.datos.web_2.funcionId,
      asientoIds: [asientoId],
      ahora,
      expiraEn: new Date(ahora.getTime() + 300 * 1000),
      limitePorComprador: null, // web_2 no tiene límite (RN04)
    });
    const estado = async () => (await mapa('web_2')).asientos.find((a) => a.id === asientoId).estado;
    expect(await estado()).toBe('apartado');
    ctx.avanzar(300);
    expect(await estado()).toBe('disponible');
  });

  test('web_2: la función muestra sólo su sala, con formato, idioma, clasificación y duración', async () => {
    const { funcion, zonas, asientos } = await mapa('web_2');
    expect(zonas).toHaveLength(1);
    expect(asientos).toHaveLength(80);
    expect(asientos.every((a) => a.zonaId === zonas[0].id)).toBe(true);
    expect(funcion).toMatchObject({ idioma: 'Por confirmar', clasificacion: 'Por confirmar', duracionMinutos: 120 });
    expect(['2D', '3D']).toContain(funcion.formato);
  });

  test('web_1: la función no trae campos de cine y muestra sus 3 zonas', async () => {
    const res = await ctx.pedir('get', `/funciones/${ctx.datos.web_1.funcionId}`, { sitio: 'web_1' });
    esperarContrato('obtenerFuncion', res, 200);
    expect(Object.keys(res.body).sort()).toEqual(['eventoId', 'id', 'inicio', 'zonas']);
    expect(res.body.zonas.map((z) => [z.id, z.precio])).toEqual([['preferente', 800], ['general', 500], ['balcon', 300]]);
  });
});
