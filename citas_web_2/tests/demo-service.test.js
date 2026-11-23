import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoService } from '../app/js/demo-service.js';

const pago = (numeroTarjeta) => ({ numeroTarjeta, titular: 'Ana Pérez', vencimiento: '12/29', cvv: '123' });

test('permite reservar, rechazar un pago de prueba y reintentar hasta aprobar', async () => {
  let reloj = new Date('2026-11-23T12:00:00-06:00');
  const demo = new DemoService({ ahora: () => new Date(reloj), almacenamiento: { reservas: [], ordenes: [] } });
  const funcion = (await demo.listarFunciones('evt-spiderman'))[0];
  const asientos = await demo.listarAsientos(funcion.id);
  const disponibles = asientos.filter((asiento) => asiento.estado === 'disponible').slice(0, 2);
  const reserva = await demo.crearReserva({ funcionId: funcion.id, asientoIds: disponibles.map((asiento) => asiento.id) });
  assert.equal(reserva.total, 200);
  assert.equal(reserva.segundosRestantes, 300);
  const rechazado = await demo.pagarReserva(reserva.id, pago('4000000000000002'));
  assert.equal(rechazado.resultado, 'rechazado');
  const aprobado = await demo.pagarReserva(reserva.id, pago('4242424242424242'));
  assert.equal(aprobado.resultado, 'aprobado');
  assert.equal(aprobado.orden.boletos.length, 2);
  assert.match(aprobado.orden.boletos[0].codigo, /^[A-Z2-9]{12}$/);
  assert.equal((await demo.buscarOrden(aprobado.orden.folio)).id, aprobado.orden.id);
});

test('un conflicto rechaza la selección completa', async () => {
  const demo = new DemoService({ almacenamiento: { reservas: [], ordenes: [] } });
  const funcion = (await demo.listarFunciones('evt-spiderman'))[20];
  const asiento = (await demo.listarAsientos(funcion.id)).find((item) => item.estado === 'disponible');
  await demo.crearReserva({ funcionId: funcion.id, asientoIds: [asiento.id] });
  await assert.rejects(() => demo.crearReserva({ funcionId: funcion.id, asientoIds: [asiento.id] }), (error) => {
    assert.equal(error.codigo, 'ASIENTO_NO_DISPONIBLE');
    assert.deepEqual(error.detalles.asientoIds, [asiento.id]);
    return true;
  });
});

test('el apartado expira a los cinco minutos', async () => {
  let reloj = new Date('2026-11-23T12:00:00-06:00');
  const demo = new DemoService({ ahora: () => new Date(reloj), almacenamiento: { reservas: [], ordenes: [] } });
  const funcion = (await demo.listarFunciones('evt-spiderman'))[0];
  const asiento = (await demo.listarAsientos(funcion.id)).find((item) => item.estado === 'disponible');
  const reserva = await demo.crearReserva({ funcionId: funcion.id, asientoIds: [asiento.id] });
  reloj = new Date(reloj.getTime() + 300000);
  await assert.rejects(() => demo.pagarReserva(reserva.id, pago('4242424242424242')), (error) => error.codigo === 'RESERVA_VENCIDA');
});
