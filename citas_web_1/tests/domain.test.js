import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ASIENTOS_POR_FILA,
  EVENTO,
  MAX_ASIENTOS,
  TARJETA_APROBADA,
  TARJETA_RECHAZADA,
  ZONAS,
  calcularTotal,
  contarAsientosComprador,
  crearIndiceOcupacion,
  crearMapaAsientos,
  esVendidoDemo,
  estadoAsiento,
  estadoReserva,
  funcionesVisibles,
  generarAsientos,
  generarCodigoBoleto,
  generarFunciones,
  generarNumeroOrden,
  precioDeAsiento,
  reservaVigente,
  segundosRestantes,
  validarLogin,
  validarPago,
  validarRegistro,
} from '../app/js/domain.js';

const T0 = new Date('2026-11-06T10:00:00-06:00');

test('el catálogo de demo respeta la oferta de web_1', () => {
  const funciones = generarFunciones();
  assert.equal(funciones.length, 120, 'jueves, viernes y sábados de oct–dic × 3 horarios');
  assert.equal(new Set(funciones.map((f) => f.id)).size, 120, 'ids únicos');
  assert.ok(funciones.every((f) => f.eventoId === EVENTO.id));
  assert.ok(funciones.every((f) => /T(15|19|21):00:00-06:00$/.test(f.inicio)));

  const dias = new Set(
    funciones.map((f) => {
      const [anio, mes, dia] = f.inicio.slice(0, 10).split('-').map(Number);
      return new Date(Date.UTC(anio, mes - 1, dia, 12)).getUTCDay();
    })
  );
  for (const dia of dias) assert.ok([4, 5, 6].includes(dia), 'sólo jueves, viernes y sábados');

  const asientos = generarAsientos();
  assert.equal(asientos.length, 120);
  assert.equal(asientos.filter((a) => a.zonaId === 'preferente').length, 30);
  assert.equal(asientos.filter((a) => a.zonaId === 'general').length, 60);
  assert.equal(asientos.filter((a) => a.zonaId === 'balcon').length, 30);
  assert.ok(asientos.every((a) => a.numero >= 1 && a.numero <= ASIENTOS_POR_FILA));
  assert.deepEqual(
    ZONAS.map((z) => z.precio),
    [800, 500, 300]
  );
});

test('la ocupación combina boletos, reservas vigentes y semilla de demo', () => {
  const ahora = T0;
  const reservas = [
    {
      id: 'res-1',
      funcionId: 'F1',
      estado: 'activa',
      expiraEn: new Date(ahora.getTime() + 60_000).toISOString(),
      asientos: [{ asientoId: 'A7' }],
    },
    {
      id: 'res-2',
      funcionId: 'F1',
      estado: 'activa',
      expiraEn: new Date(ahora.getTime() - 1_000).toISOString(),
      asientos: [{ asientoId: 'A8' }],
    },
  ];
  const ordenes = [{ boletos: [{ funcionId: 'F1', asientoId: 'B1' }] }];
  const indice = crearIndiceOcupacion({ reservas, ordenes, ahora });

  assert.equal(estadoAsiento('F1', 'A7', indice), 'apartado');
  assert.equal(estadoAsiento('F1', 'A8', indice), 'disponible', 'una reserva vencida libera el asiento');
  assert.equal(estadoAsiento('F1', 'B1', indice), 'comprado');
  assert.equal(estadoAsiento('F1', 'C10', indice, { semilla: false }), 'disponible');
  assert.equal(esVendidoDemo('F1', 'A7'), false, 'A7 siempre está libre para las pruebas');
  assert.equal(esVendidoDemo('F1', 'A7'), esVendidoDemo('F1', 'A7'), 'la semilla es determinista');
});

test('el mapa de asientos incluye zonas, estados y hora de consulta', () => {
  const funcion = { id: 'F1', eventoId: EVENTO.id, inicio: '2026-11-06T19:00:00-06:00' };
  const mapa = crearMapaAsientos(funcion, crearIndiceOcupacion({}), { ahora: T0 });
  assert.equal(mapa.funcion.id, 'F1');
  assert.equal(mapa.zonas.length, 3);
  assert.equal(mapa.asientos.length, 120);
  assert.equal(mapa.consultadoEn, T0.toISOString());
  assert.ok(mapa.asientos.every((a) => ['disponible', 'apartado', 'comprado'].includes(a.estado)));
});

test('los precios y totales salen de la zona', () => {
  assert.equal(precioDeAsiento('preferente'), 800);
  assert.equal(precioDeAsiento('general'), 500);
  assert.equal(precioDeAsiento('balcon'), 300);
  assert.equal(precioDeAsiento('inexistente'), 0);
  assert.equal(calcularTotal([{ precio: 800 }, { precio: 300 }]), 1100);
  assert.equal(calcularTotal([]), 0);
});

test('reserva vigente, vencida y segundos restantes', () => {
  const reserva = {
    estado: 'activa',
    expiraEn: new Date(T0.getTime() + 180_000).toISOString(),
  };
  assert.equal(reservaVigente(reserva, T0), true);
  assert.equal(segundosRestantes(reserva, T0), 180);
  assert.equal(estadoReserva(reserva, T0), 'activa');
  assert.equal(estadoReserva(reserva, new Date(T0.getTime() + 300_000)), 'vencida');
  assert.equal(segundosRestantes(reserva, new Date(T0.getTime() + 300_000)), 0);
  assert.equal(estadoReserva({ ...reserva, estado: 'pagada' }, T0), 'pagada');
  assert.equal(estadoReserva({ ...reserva, estado: 'liberada' }, T0), 'liberada');
});

test('el límite de 10 suma boletos y reservas vigentes, no las vencidas', () => {
  const ahora = T0;
  const reservas = [
    {
      compradorId: 'cmp-1',
      funcionId: 'F1',
      estado: 'activa',
      expiraEn: new Date(ahora.getTime() + 60_000).toISOString(),
      asientos: Array.from({ length: 5 }, (_, i) => ({ asientoId: `A${i + 1}` })),
    },
    {
      compradorId: 'cmp-1',
      funcionId: 'F1',
      estado: 'activa',
      expiraEn: new Date(ahora.getTime() - 60_000).toISOString(),
      asientos: Array.from({ length: 10 }, (_, i) => ({ asientoId: `B${i + 1}` })),
    },
  ];
  const ordenes = [
    {
      compradorId: 'cmp-1',
      boletos: Array.from({ length: 4 }, (_, i) => ({ funcionId: 'F1', asientoId: `C${i + 1}` })),
    },
  ];
  assert.equal(
    contarAsientosComprador({ compradorId: 'cmp-1', funcionId: 'F1', reservas, ordenes, ahora }),
    9
  );
  assert.equal(
    contarAsientosComprador({ compradorId: 'cmp-2', funcionId: 'F1', reservas, ordenes, ahora }),
    0,
    'cada comprador cuenta sólo lo suyo'
  );
  assert.ok(MAX_ASIENTOS === 10);
});

test('valida la tarjeta aprobada, la rechazada y los errores de formato (D14)', () => {
  const aprobada = validarPago(
    { numeroTarjeta: '4242 4242 4242 4242', titular: 'ANA PEREZ', vencimiento: '12/28', cvv: '123' },
    T0
  );
  assert.equal(aprobada.valido, true);
  assert.equal(aprobada.resultado, 'aprobado');
  assert.equal(aprobada.ultimosDigitos, '4242');

  const rechazada = validarPago(
    { numeroTarjeta: '4000 0000 0000 0002', titular: 'ANA PEREZ', vencimiento: '12/28', cvv: '123' },
    T0
  );
  assert.equal(rechazada.valido, true);
  assert.equal(rechazada.resultado, 'rechazado');

  const otra = validarPago(
    { numeroTarjeta: '4111 1111 1111 1111', titular: 'ANA PEREZ', vencimiento: '12/28', cvv: '123' },
    T0
  );
  assert.equal(otra.valido, false);
  assert.ok(otra.errores.numeroTarjeta);

  const vencida = validarPago(
    { numeroTarjeta: TARJETA_APROBADA, titular: 'ANA PEREZ', vencimiento: '10/26', cvv: '123' },
    T0
  );
  assert.equal(vencida.valido, false);
  assert.ok(vencida.errores.vencimiento);

  const cvvMalo = validarPago(
    { numeroTarjeta: TARJETA_RECHAZADA, titular: 'ANA PEREZ', vencimiento: '12/28', cvv: '12' },
    T0
  );
  assert.equal(cvvMalo.valido, false);
  assert.ok(cvvMalo.errores.cvv);
});

test('valida registro y login', () => {
  const registro = validarRegistro({
    nombre: 'Ana Pérez',
    correo: 'ANA@TEATRO.MX',
    contrasena: 'Demo1234!',
    confirmacion: 'Demo1234!',
  });
  assert.equal(registro.valido, true);
  assert.equal(registro.datos.correo, 'ana@teatro.mx');

  assert.equal(validarRegistro({ nombre: 'A', correo: 'no', contrasena: '123', confirmacion: 'x' }).valido, false);
  assert.equal(validarLogin({ correo: 'ana@teatro.mx', contrasena: 'x' }).valido, true);
  assert.equal(validarLogin({ correo: 'mal', contrasena: '' }).valido, false);
});

test('folios y códigos de boleto cumplen el contrato', () => {
  assert.equal(generarNumeroOrden(123), 'ORD-000123');
  assert.equal(generarNumeroOrden(1), 'ORD-000001');
  for (let i = 0; i < 20; i += 1) {
    const codigo = generarCodigoBoleto();
    assert.match(codigo, /^[A-Z2-9]{12}$/);
  }
});

test('funcionesVisibles prioriza el futuro y no rompe fuera de temporada', () => {
  const funciones = [
    { id: 'pasada', inicio: '2026-10-01T15:00:00-06:00' },
    { id: 'futura', inicio: '2026-11-20T19:00:00-06:00' },
  ];
  assert.deepEqual(funcionesVisibles(funciones, T0).map((f) => f.id), ['futura']);
  const fuera = funcionesVisibles(funciones, new Date('2027-02-01T00:00:00-06:00'));
  assert.equal(fuera.length, 2, 'fuera de temporada se muestra la cartelera completa');
});
