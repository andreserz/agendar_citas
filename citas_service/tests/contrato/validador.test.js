'use strict';

// Tarea 7.1 — El validador de esquemas que usan las pruebas de contrato detecta lo que debe.
const { validarEsquema, validarRespuesta } = require('./apoyo/openapi');

const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });

const reservaValida = {
  id: '3f6c2a8e-1b4d-4c7a-9e2f-5a6b7c8d9e0f',
  sitio: 'web_2',
  funcionId: 'fun-1',
  estado: 'activa',
  asientos: [{ asientoId: 'A1', etiqueta: 'A1', zonaId: 'general', precio: 500 }],
  total: 500,
  moneda: 'MXN',
  creadaEn: '2026-11-20T12:00:00-06:00',
  expiraEn: '2026-11-20T12:05:00-06:00',
  segundosRestantes: 300,
};

describe('validarEsquema', () => {
  test('acepta una Reserva que cumple la spec', () => {
    expect(validarEsquema(ref('Reserva'), reservaValida)).toEqual([]);
  });

  test.each([
    ['falta un campo requerido', { ...reservaValida, expiraEn: undefined }, /expiraEn: falta/],
    ['enum fuera de la lista', { ...reservaValida, estado: 'apartada' }, /estado/],
    ['tipo incorrecto', { ...reservaValida, total: '500' }, /total: se esperaba number/],
    ['campo opcional en null', { ...reservaValida, ordenId: null }, /ordenId: se esperaba string/],
    ['minimum', { ...reservaValida, segundosRestantes: -1 }, /segundosRestantes/],
    ['formato uuid', { ...reservaValida, id: 'abc' }, /formato uuid/],
    ['formato date-time', { ...reservaValida, creadaEn: '20/11/2026' }, /formato date-time/],
    ['elemento de arreglo', { ...reservaValida, asientos: [{ asientoId: 'A1' }] }, /asientos\[0\]\.etiqueta: falta/],
  ])('detecta: %s', (_, valor, patron) => {
    const limpio = JSON.parse(JSON.stringify(valor));
    expect(validarEsquema(ref('Reserva'), limpio).join('\n')).toMatch(patron);
  });

  test('pattern: Folio y CodigoBoleto', () => {
    expect(validarEsquema(ref('Folio'), 'ORD-000123')).toEqual([]);
    expect(validarEsquema(ref('Folio'), 'ORD-123')).not.toEqual([]);
    expect(validarEsquema(ref('CodigoBoleto'), '7KQ2M9XD4TPA')).toEqual([]);
    expect(validarEsquema(ref('CodigoBoleto'), '7KQ2M9XD4TP0')).not.toEqual([]); // 0 no está permitido
  });

  test('arreglos: minItems, maxItems y uniqueItems de NuevaReserva', () => {
    const base = { funcionId: 'f' };
    expect(validarEsquema(ref('NuevaReserva'), { ...base, asientoIds: [] })).not.toEqual([]);
    expect(validarEsquema(ref('NuevaReserva'), { ...base, asientoIds: ['A1', 'A1'] })).not.toEqual([]);
    const once = Array.from({ length: 11 }, (_, i) => `A${i}`);
    expect(validarEsquema(ref('NuevaReserva'), { ...base, asientoIds: once })).not.toEqual([]);
  });
});

describe('validarRespuesta', () => {
  const json = (status, body) => ({ status, body, text: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

  test('rechaza un status que la operación no declara', () => {
    expect(validarRespuesta('listarEventos', json(404, {})).join()).toMatch(/no está declarado/);
  });

  test('valida el cuerpo de error contra el esquema Error', () => {
    const ok = json(404, { error: { codigo: 'NO_ENCONTRADO', mensaje: 'x' } });
    const mal = json(404, { error: { codigo: 'OTRO', mensaje: 'x' } });
    expect(validarRespuesta('obtenerEvento', ok)).toEqual([]);
    expect(validarRespuesta('obtenerEvento', mal)).not.toEqual([]);
  });

  test('un 204 debe llegar sin cuerpo', () => {
    expect(validarRespuesta('liberarReserva', { status: 204, text: '', headers: {} })).toEqual([]);
    expect(validarRespuesta('liberarReserva', { status: 204, text: '{}', headers: {} })).not.toEqual([]);
  });
});
