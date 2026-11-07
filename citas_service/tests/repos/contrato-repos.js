'use strict';

/**
 * Pruebas de contrato de AsientosRepo, ReservasRepo y OrdenesRepo.
 * Cualquier implementación (memoria, SQL Server) debe pasarlas. Suponen los datos
 * iniciales de web_1 (BCK_DEFINICION.md §7). Uso:
 *
 *   probarContratoRepos('memoria', () => crearReposEnMemoria());
 */

const { AsientosRepo, ReservasRepo, OrdenesRepo } = require('../../app/repos/interfaces');
const { CODIGOS } = require('../../app/repos/errores');

const MIN = 60 * 1000;
const FUNCION = 'fun-2026-11-06-1900';
const OTRA_FUNCION = 'fun-2026-11-07-1500';
const T0 = new Date('2026-11-06T18:00:00.000Z');
const en = (minutos) => new Date(T0.getTime() + minutos * MIN);

/** Espera que la promesa falle con un ErrorRepositorio del código indicado y lo devuelve. */
async function fallaCon(promesa, codigo) {
  let error;
  try {
    await promesa;
  } catch (e) {
    error = e;
  }
  expect(error).toBeDefined();
  expect(error.codigo).toBe(codigo);
  return error;
}

function probarContratoRepos(nombre, crearRepos) {
  describe(`Repositorios (${nombre})`, () => {
    let asientosRepo;
    let reservasRepo;
    let ordenesRepo;

    beforeEach(async () => {
      ({ asientosRepo, reservasRepo, ordenesRepo } = await crearRepos());
    });

    const apartar = (asientoIds, extra = {}) =>
      reservasRepo.crear({
        sitio: 'web_1',
        compradorId: 'cmp-ana',
        funcionId: FUNCION,
        asientoIds,
        ahora: T0,
        expiraEn: en(5),
        ...extra,
      });

    const estadosDe = async (funcionId, ahora, ids) => {
      const asientos = await asientosRepo.listarAsientos(funcionId, ahora);
      return Object.fromEntries(asientos.filter((a) => ids.includes(a.id)).map((a) => [a.id, a.estado]));
    };

    describe('implementa las interfaces', () => {
      test.each([
        ['asientosRepo', AsientosRepo],
        ['reservasRepo', ReservasRepo],
        ['ordenesRepo', OrdenesRepo],
      ])('%s extiende su interfaz y sobrescribe todos sus métodos', (clave, Interfaz) => {
        const repo = { asientosRepo, reservasRepo, ordenesRepo }[clave];
        expect(repo).toBeInstanceOf(Interfaz);
        const metodos = Object.getOwnPropertyNames(Interfaz.prototype).filter((m) => m !== 'constructor');
        for (const metodo of metodos) {
          expect(repo[metodo]).not.toBe(Interfaz.prototype[metodo]);
        }
      });
    });

    describe('AsientosRepo', () => {
      test('lista el evento de web_1 y filtra por sitio', async () => {
        const eventos = await asientosRepo.listarEventos();
        expect(eventos).toEqual([
          expect.objectContaining({ id: 'evt-suegra', sitio: 'web_1', nombre: '¡Que no se entere la suegra!' }),
        ]);
        expect(await asientosRepo.listarEventos({ sitio: 'web_2' })).toEqual([]);
        expect(await asientosRepo.obtenerEvento('evt-suegra')).toMatchObject({ id: 'evt-suegra' });
        expect(await asientosRepo.obtenerEvento('no-existe')).toBeNull();
      });

      test('lista 120 funciones ordenadas por inicio', async () => {
        const funciones = await asientosRepo.listarFunciones('evt-suegra');
        expect(funciones).toHaveLength(120);
        const inicios = funciones.map((f) => f.inicio.getTime());
        expect([...inicios].sort((a, b) => a - b)).toEqual(inicios);
        await fallaCon(asientosRepo.listarFunciones('no-existe'), CODIGOS.NO_ENCONTRADO);
      });

      test('obtiene una función con su inicio en UTC (19:00 CDMX = 01:00 UTC del día siguiente)', async () => {
        const funcion = await asientosRepo.obtenerFuncion(FUNCION);
        expect(funcion).toEqual({
          id: FUNCION,
          eventoId: 'evt-suegra',
          inicio: new Date('2026-11-07T01:00:00.000Z'),
        });
        expect(await asientosRepo.obtenerFuncion('no-existe')).toBeNull();
      });

      test('lista 3 zonas con su precio en la función', async () => {
        const zonas = await asientosRepo.listarZonas(FUNCION);
        expect(zonas).toEqual([
          { id: 'preferente', nombre: 'Preferente', precio: 800, moneda: 'MXN' },
          { id: 'general', nombre: 'General', precio: 500, moneda: 'MXN' },
          { id: 'balcon', nombre: 'Balcón', precio: 300, moneda: 'MXN' },
        ]);
        await fallaCon(asientosRepo.listarZonas('no-existe'), CODIGOS.NO_ENCONTRADO);
      });

      test('lista 120 asientos disponibles con precio y sin datos del comprador', async () => {
        const asientos = await asientosRepo.listarAsientos(FUNCION, T0);
        expect(asientos).toHaveLength(120);
        expect(asientos.every((a) => a.estado === 'disponible')).toBe(true);
        expect(asientos.find((a) => a.id === 'A7')).toEqual({
          id: 'A7', zonaId: 'preferente', fila: 'A', numero: 7, etiqueta: 'A7', precio: 800, estado: 'disponible',
        });
        expect(asientos.find((a) => a.id === 'L10')).toMatchObject({ zonaId: 'balcon', precio: 300 });
        await fallaCon(asientosRepo.listarAsientos('no-existe', T0), CODIGOS.NO_ENCONTRADO);
      });

      test('exige `ahora` como fecha', async () => {
        await expect(asientosRepo.listarAsientos(FUNCION)).rejects.toThrow(TypeError);
      });
    });

    describe('ReservasRepo.crear', () => {
      test('aparta los asientos con precio, total y vencimiento recibidos', async () => {
        const reserva = await apartar(['A1', 'D1', 'J1']);
        expect(reserva).toMatchObject({
          sitio: 'web_1',
          compradorId: 'cmp-ana',
          funcionId: FUNCION,
          estado: 'activa',
          total: 1600,
          moneda: 'MXN',
          creadaEn: T0,
          expiraEn: en(5),
          ordenId: null,
          asientos: [
            { asientoId: 'A1', etiqueta: 'A1', zonaId: 'preferente', precio: 800 },
            { asientoId: 'D1', etiqueta: 'D1', zonaId: 'general', precio: 500 },
            { asientoId: 'J1', etiqueta: 'J1', zonaId: 'balcon', precio: 300 },
          ],
        });
        expect(reserva.id).toMatch(/^res-/);
        expect(await estadosDe(FUNCION, en(1), ['A1', 'A2'])).toEqual({ A1: 'apartado', A2: 'disponible' });
      });

      test('el apartado sólo afecta a su función', async () => {
        await apartar(['A1']);
        expect(await estadosDe(OTRA_FUNCION, en(1), ['A1'])).toEqual({ A1: 'disponible' });
      });

      test('todo o nada: si un asiento está apartado, no aparta ninguno e indica cuál', async () => {
        await apartar(['A2']);
        const error = await fallaCon(
          apartar(['A1', 'A2'], { compradorId: 'cmp-beto', sitio: 'web_2' }),
          CODIGOS.ASIENTO_NO_DISPONIBLE
        );
        expect(error.detalles.asientos).toEqual([{ asientoId: 'A2', etiqueta: 'A2', estado: 'apartado' }]);
        expect(await estadosDe(FUNCION, en(1), ['A1'])).toEqual({ A1: 'disponible' });
      });

      test('dos apartados simultáneos del mismo asiento: sólo uno tiene éxito (RN02)', async () => {
        const resultados = await Promise.allSettled([
          apartar(['B5'], { compradorId: 'cmp-ana' }),
          apartar(['B5'], { compradorId: 'cmp-beto', sitio: 'web_2' }),
        ]);
        expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
        const rechazo = resultados.find((r) => r.status === 'rejected');
        expect(rechazo.reason.codigo).toBe(CODIGOS.ASIENTO_NO_DISPONIBLE);
      });

      test('al vencer, el asiento vuelve a estar disponible y otro comprador lo puede apartar', async () => {
        await apartar(['C3']);
        expect(await estadosDe(FUNCION, en(4.99), ['C3'])).toEqual({ C3: 'apartado' });
        expect(await estadosDe(FUNCION, en(5), ['C3'])).toEqual({ C3: 'disponible' });
        const otra = await apartar(['C3'], { compradorId: 'cmp-beto', ahora: en(6), expiraEn: en(11) });
        expect(otra.estado).toBe('activa');
      });

      test.each([
        ['lista vacía', []],
        ['asientos repetidos', ['A1', 'A1']],
        ['más de 10 asientos', ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'B1']],
        ['no es arreglo', 'A1'],
      ])('rechaza %s con SOLICITUD_INVALIDA', async (_caso, asientoIds) => {
        await fallaCon(apartar(asientoIds), CODIGOS.SOLICITUD_INVALIDA);
      });

      test('rechaza asientos que no existen e indica cuáles', async () => {
        const error = await fallaCon(apartar(['A1', 'Z99']), CODIGOS.SOLICITUD_INVALIDA);
        expect(error.detalles).toEqual({ asientoIds: ['Z99'] });
      });

      test('rechaza expiraEn que no sea posterior a ahora', async () => {
        await fallaCon(apartar(['A1'], { expiraEn: T0 }), CODIGOS.SOLICITUD_INVALIDA);
      });

      test('rechaza una función inexistente', async () => {
        await fallaCon(apartar(['A1'], { funcionId: 'no-existe' }), CODIGOS.NO_ENCONTRADO);
      });

      test('aplica el límite por comprador y función cuando se indica', async () => {
        await apartar(['A1', 'A2', 'A3', 'A4', 'A5', 'A6'], { limitePorComprador: 10 });
        const error = await fallaCon(
          apartar(['B1', 'B2', 'B3', 'B4', 'B5'], { limitePorComprador: 10, sitio: 'web_2' }),
          CODIGOS.LIMITE_EXCEDIDO
        );
        expect(error.detalles).toEqual({ limite: 10, actuales: 6, solicitados: 5 });
        // Otro comprador no se ve afectado; tampoco la misma persona en otra función.
        await apartar(['B1', 'B2', 'B3', 'B4', 'B5'], { limitePorComprador: 10, compradorId: 'cmp-beto' });
        await apartar(['B1', 'B2', 'B3', 'B4', 'B5'], { limitePorComprador: 10, funcionId: OTRA_FUNCION });
      });
    });

    describe('ReservasRepo: consultar, contar y liberar', () => {
      test('obtener calcula el estado vencida sin guardarlo', async () => {
        const { id } = await apartar(['A1']);
        expect((await reservasRepo.obtener(id, en(4))).estado).toBe('activa');
        expect((await reservasRepo.obtener(id, en(5))).estado).toBe('vencida');
        expect(await reservasRepo.obtener('res-no-existe', T0)).toBeNull();
      });

      test('lista sólo las reservas activas y vigentes del comprador', async () => {
        const vigente = await apartar(['A1'], { ahora: en(3), expiraEn: en(8) });
        await apartar(['A2']); // vence en el minuto 5
        await apartar(['A3'], { compradorId: 'cmp-beto' });
        const activas = await reservasRepo.listarActivasDeComprador('cmp-ana', en(6));
        expect(activas.map((r) => r.id)).toEqual([vigente.id]);
      });

      test('cuenta apartados vigentes y comprados, no los vencidos ni liberados', async () => {
        const pagada = await apartar(['A1', 'A2']);
        await ordenesRepo.pagar({ reservaId: pagada.id, ahora: en(1) });
        const liberada = await apartar(['A3']);
        await reservasRepo.liberar(liberada.id, en(1));
        await apartar(['A4', 'A5', 'A6'], { ahora: en(2), expiraEn: en(7) });
        await apartar(['A7']); // vence en el minuto 5

        const contar = (ahora) =>
          reservasRepo.contarAsientosDeComprador({ compradorId: 'cmp-ana', funcionId: FUNCION, ahora });
        expect(await contar(en(4))).toBe(6); // 2 comprados + 3 + 1 vigentes
        expect(await contar(en(5))).toBe(5); // A7 venció
        expect(await contar(en(7))).toBe(2); // sólo los comprados
      });

      test('liberar devuelve los asientos y no se puede repetir', async () => {
        const { id } = await apartar(['A1', 'A2']);
        const liberada = await reservasRepo.liberar(id, en(1));
        expect(liberada.estado).toBe('liberada');
        expect(await estadosDe(FUNCION, en(1), ['A1', 'A2'])).toEqual({ A1: 'disponible', A2: 'disponible' });
        await fallaCon(reservasRepo.liberar(id, en(2)), CODIGOS.RESERVA_LIBERADA);
        await fallaCon(reservasRepo.liberar('res-no-existe', en(2)), CODIGOS.NO_ENCONTRADO);
      });

      test('liberar una reserva vencida no quita el asiento a quien lo apartó después', async () => {
        const vieja = await apartar(['A1']);
        await apartar(['A1'], { compradorId: 'cmp-beto', ahora: en(6), expiraEn: en(11) });
        await reservasRepo.liberar(vieja.id, en(7));
        expect(await estadosDe(FUNCION, en(7), ['A1'])).toEqual({ A1: 'apartado' });
      });

      test('pago rechazado: se registra y no cambia la reserva ni su vencimiento (RN06)', async () => {
        const reserva = await apartar(['A1']);
        const intento = await reservasRepo.registrarPagoRechazado({ reservaId: reserva.id, ahora: en(1) });
        expect(intento).toMatchObject({ reservaId: reserva.id, resultado: 'rechazado', fecha: en(1) });
        const despues = await reservasRepo.obtener(reserva.id, en(1));
        expect(despues).toMatchObject({ estado: 'activa', expiraEn: en(5) });
        await fallaCon(
          reservasRepo.registrarPagoRechazado({ reservaId: reserva.id, ahora: en(5) }),
          CODIGOS.RESERVA_VENCIDA
        );
      });

      test('los objetos devueltos son copias', async () => {
        const reserva = await apartar(['A1']);
        reserva.asientos.push({ asientoId: 'X' });
        reserva.estado = 'pagada';
        const guardada = await reservasRepo.obtener(reserva.id, en(1));
        expect(guardada.asientos).toHaveLength(1);
        expect(guardada.estado).toBe('activa');
      });
    });

    describe('OrdenesRepo', () => {
      test('pagar crea la orden con boletos y deja los asientos comprados', async () => {
        const reserva = await apartar(['A1', 'D2']);
        const { intento, orden } = await ordenesRepo.pagar({ reservaId: reserva.id, ahora: en(2) });

        expect(intento).toMatchObject({ reservaId: reserva.id, resultado: 'aprobado', fecha: en(2) });
        expect(orden).toMatchObject({
          numero: 'ORD-000001',
          reservaId: reserva.id,
          sitio: 'web_1',
          compradorId: 'cmp-ana',
          fecha: en(2),
          total: 1300,
          moneda: 'MXN',
        });
        expect(orden.boletos).toHaveLength(2);
        expect(orden.boletos[0]).toMatchObject({
          eventoId: 'evt-suegra',
          eventoNombre: '¡Que no se entere la suegra!',
          funcionId: FUNCION,
          inicio: new Date('2026-11-07T01:00:00.000Z'),
          zonaId: 'preferente',
          asientoId: 'A1',
          etiqueta: 'A1',
          precio: 800,
        });
        for (const boleto of orden.boletos) expect(boleto.codigo).toMatch(/^[A-HJ-NP-Z2-9]{12}$/);
        expect(new Set(orden.boletos.map((b) => b.codigo)).size).toBe(2);

        expect(await reservasRepo.obtener(reserva.id, en(10))).toMatchObject({ estado: 'pagada', ordenId: orden.id });
        // Comprado no se libera aunque pase el vencimiento original.
        expect(await estadosDe(FUNCION, en(10), ['A1', 'D2'])).toEqual({ A1: 'comprado', D2: 'comprado' });
        await fallaCon(apartar(['A1'], { compradorId: 'cmp-beto', ahora: en(10), expiraEn: en(15) }),
          CODIGOS.ASIENTO_NO_DISPONIBLE);
      });

      test('los folios son consecutivos', async () => {
        const r1 = await apartar(['A1']);
        const r2 = await apartar(['A2']);
        expect((await ordenesRepo.pagar({ reservaId: r1.id, ahora: en(1) })).orden.numero).toBe('ORD-000001');
        expect((await ordenesRepo.pagar({ reservaId: r2.id, ahora: en(1) })).orden.numero).toBe('ORD-000002');
      });

      test('no paga una reserva vencida, pagada, liberada o inexistente', async () => {
        const vencida = await apartar(['A1']);
        await fallaCon(ordenesRepo.pagar({ reservaId: vencida.id, ahora: en(5) }), CODIGOS.RESERVA_VENCIDA);
        expect(await ordenesRepo.listarDeComprador('cmp-ana')).toEqual([]);

        const pagada = await apartar(['A2']);
        await ordenesRepo.pagar({ reservaId: pagada.id, ahora: en(1) });
        await fallaCon(ordenesRepo.pagar({ reservaId: pagada.id, ahora: en(2) }), CODIGOS.RESERVA_PAGADA);
        await fallaCon(reservasRepo.liberar(pagada.id, en(2)), CODIGOS.RESERVA_PAGADA);

        const liberada = await apartar(['A3']);
        await reservasRepo.liberar(liberada.id, en(1));
        await fallaCon(ordenesRepo.pagar({ reservaId: liberada.id, ahora: en(2) }), CODIGOS.RESERVA_LIBERADA);

        await fallaCon(ordenesRepo.pagar({ reservaId: 'res-no-existe', ahora: en(1) }), CODIGOS.NO_ENCONTRADO);
      });

      test('se puede pagar después de un rechazo mientras la reserva siga vigente', async () => {
        const reserva = await apartar(['A1']);
        await reservasRepo.registrarPagoRechazado({ reservaId: reserva.id, ahora: en(1) });
        const { orden } = await ordenesRepo.pagar({ reservaId: reserva.id, ahora: en(4) });
        expect(orden.total).toBe(800);
      });

      test('consulta órdenes por id, por comprador y los boletos para consolidación', async () => {
        const r1 = await apartar(['A1']);
        const r2 = await apartar(['B1'], { compradorId: 'cmp-beto', sitio: 'web_2' });
        const { orden: o1 } = await ordenesRepo.pagar({ reservaId: r1.id, ahora: en(1) });
        await ordenesRepo.pagar({ reservaId: r2.id, ahora: en(2) });

        expect(await ordenesRepo.obtener(o1.id)).toEqual(o1);
        expect(await ordenesRepo.obtener('ord-no-existe')).toBeNull();
        expect((await ordenesRepo.listarDeComprador('cmp-ana')).map((o) => o.id)).toEqual([o1.id]);

        const boletos = await ordenesRepo.listarBoletos();
        expect(boletos).toHaveLength(2);
        expect(boletos).toContainEqual(expect.objectContaining({
          ordenId: o1.id, compradorId: 'cmp-ana', sitio: 'web_1', asientoId: 'A1', precio: 800, fechaCompra: en(1),
        }));
      });
    });
  });
}

module.exports = { probarContratoRepos };
