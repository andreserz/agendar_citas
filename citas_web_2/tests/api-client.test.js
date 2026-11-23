import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiCliente } from '../app/js/api-client.js';

function respuesta(datos, status = 200) {
  return new Response(JSON.stringify(datos), { status, headers: { 'Content-Type': 'application/json' } });
}

test('todas las peticiones llevan X-Sitio y omiten Authorization', async () => {
  const llamadas = [];
  const cliente = new ApiCliente({ apiBaseUrl: 'http://localhost:3000/api/v1', sitio: 'web_2' }, async (url, opciones) => {
    llamadas.push({ url, opciones });
    return respuesta({ reserva: { id: 'reserva-1' } }, 201);
  });
  await cliente.crearReserva({ funcionId: 'funcion-1', asientoIds: ['A1'] });
  assert.equal(llamadas[0].opciones.headers['X-Sitio'], 'web_2');
  assert.equal(Object.keys(llamadas[0].opciones.headers).some((key) => key.toLowerCase() === 'authorization'), false);
  assert.equal(llamadas[0].opciones.credentials, 'omit');
  assert.deepEqual(JSON.parse(llamadas[0].opciones.body), { funcionId: 'funcion-1', asientoIds: ['A1'] });
});

test('recupera órdenes por folio y codifica el parámetro', async () => {
  let urlLlamada;
  const cliente = new ApiCliente({ apiBaseUrl: 'http://localhost:3000/api/v1', sitio: 'web_2' }, async (url) => {
    urlLlamada = url;
    return respuesta({ orden: { folio: 'ORD-000123' } });
  });
  const orden = await cliente.buscarOrden('ORD-000123');
  assert.equal(new URL(urlLlamada).pathname, '/api/v1/ordenes/buscar');
  assert.equal(new URL(urlLlamada).searchParams.get('folio'), 'ORD-000123');
  assert.equal(orden.folio, 'ORD-000123');
});

test('normaliza un error del contrato con su estado y código', async () => {
  const cliente = new ApiCliente({ apiBaseUrl: 'http://localhost:3000/api/v1', sitio: 'web_2' }, async () =>
    respuesta({ error: { codigo: 'ASIENTO_NO_DISPONIBLE', mensaje: 'Conflicto', detalles: { asientoIds: ['F7'] } } }, 409));
  await assert.rejects(() => cliente.crearReserva({ funcionId: 'f1', asientoIds: ['F7'] }), (error) => {
    assert.equal(error.codigo, 'ASIENTO_NO_DISPONIBLE');
    assert.equal(error.estado, 409);
    assert.deepEqual(error.detalles, { asientoIds: ['F7'] });
    return true;
  });
});

test('forma los filtros de reporte diario', async () => {
  let urlLlamada;
  const cliente = new ApiCliente({ apiBaseUrl: 'http://localhost:3000/api/v1', sitio: 'web_2' }, async (url) => {
    urlLlamada = url;
    return respuesta({ dias: [{ dia: '2026-11-23', total: 6 }] });
  });
  const dias = await cliente.reporteReservas({ desde: '2026-11-23', hasta: '2026-11-23' });
  assert.equal(new URL(urlLlamada).searchParams.get('desde'), '2026-11-23');
  assert.equal(new URL(urlLlamada).searchParams.get('hasta'), '2026-11-23');
  assert.equal(dias[0].total, 6);
});
