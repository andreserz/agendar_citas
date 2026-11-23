import test from 'node:test';
import assert from 'node:assert/strict';
import {
  agregarSeleccion, crearFuncionesDemo, crearAsientosDemo, normalizarEstado, precioFuncion,
  totalSeleccion, validarTarjeta, TARJETA_APROBADA, MAX_ASIENTOS,
} from '../app/js/domain.js';

test('la semilla de web_2 contiene treinta funciones por día durante treinta días', () => {
  const funciones = crearFuncionesDemo();
  assert.equal(funciones.length, 900);
  const porDia = new Map();
  for (const funcion of funciones) {
    const dia = funcion.inicio.slice(0, 10);
    porDia.set(dia, (porDia.get(dia) || 0) + 1);
  }
  assert.equal(porDia.size, 30);
  assert.ok([...porDia.values()].every((total) => total === 30));
});

test('el precio de la función determina el precio por butaca y el total', () => {
  const funcion2D = { zonas: [{ precio: 100 }] };
  const funcion3D = { zonas: [{ precio: 150 }] };
  assert.equal(precioFuncion(funcion2D), 100);
  assert.equal(precioFuncion(funcion3D), 150);
  const asientos = [{ id: 'a', precio: 150 }, { id: 'b', precio: 150 }, { id: 'c', precio: 150 }];
  assert.equal(totalSeleccion(asientos, new Set(['a', 'b', 'c']), 150), 450);
});

test('normaliza los estados que usa el servicio', () => {
  assert.equal(normalizarEstado('disponible'), 'disponible');
  assert.equal(normalizarEstado('apartado'), 'apartada');
  assert.equal(normalizarEstado('comprado'), 'vendida');
});

test('limita la selección a diez y no permite seleccionar una butaca ocupada', () => {
  const asientos = Array.from({ length: 11 }, (_, index) => ({ id: `A${index + 1}`, estado: 'disponible' }));
  let seleccion = new Set();
  for (const asiento of asientos.slice(0, MAX_ASIENTOS)) {
    seleccion = agregarSeleccion(seleccion, asiento, asientos).seleccion;
  }
  const limite = agregarSeleccion(seleccion, asientos[10], asientos);
  assert.equal(limite.seleccion.size, 10);
  assert.match(limite.error, /hasta 10/);
  const ocupada = agregarSeleccion(new Set(), { id: 'A8', estado: 'comprado' }, asientos);
  assert.equal(ocupada.seleccion.size, 0);
  assert.ok(ocupada.error);
});

test('la semilla dibuja ochenta butacas en ocho filas y diez columnas', () => {
  const asientos = crearAsientosDemo('funcion-demo');
  assert.equal(asientos.length, 80);
  assert.deepEqual([...new Set(asientos.map((asiento) => asiento.fila))], [...'ABCDEFGH']);
  assert.equal(asientos.filter((asiento) => asiento.numero === 10).length, 8);
});

test('valida la tarjeta aprobada de prueba y rechaza números ajenos', () => {
  const base = { titular: 'Ana Pérez', vencimiento: '12/29', cvv: '123' };
  assert.equal(validarTarjeta({ ...base, numeroTarjeta: TARJETA_APROBADA }).valido, true);
  assert.equal(validarTarjeta({ ...base, numeroTarjeta: '5555555555554444' }).valido, false);
});
