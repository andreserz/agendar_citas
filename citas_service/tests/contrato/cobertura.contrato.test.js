'use strict';

/**
 * Tarea 7.1 — Requirement: Pruebas de contrato.
 * Pruebas que corren desde ya, sin importar qué routers existan:
 * - la spec y estas pruebas están completas y alineadas (cada operación tiene router y prueba);
 * - los códigos de error de la spec tienen el status que usa el manejador de errores;
 * - toda operación (menos `/salud`) rechaza la falta de `X-Sitio` con la forma de la spec;
 * - una ruta fuera del contrato responde `404 NO_ENCONTRADO`.
 */
const fs = require('fs');
const path = require('path');

const { ROUTERS_DE_NEGOCIO } = require('../../app/rutas');
const { STATUS_POR_CODIGO } = require('../../app/middlewares/errores');
const { spec, operaciones, palabrasNoSoportadas } = require('./apoyo/openapi');
const { crearContexto, routerDeRuta, routerExiste, modoEstricto } = require('./apoyo/app');
const { esperarContrato, esperarError } = require('./apoyo/esperar');

const OPERACIONES = operaciones();

// Texto de las pruebas de contrato por router, para saber qué operaciones ya tienen prueba.
const TEXTO_PRUEBAS = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith('.contrato.test.js') && f !== path.basename(__filename))
  .map((f) => fs.readFileSync(path.join(__dirname, f), 'utf8'))
  .join('\n');

/** Pasa `/reservas/{reservaId}/pago` a una ruta concreta que cumpla el patrón. */
function rutaConcreta(ruta) {
  return ruta.replace(/\{[^}]+\}/g, '00000000-0000-4000-8000-000000000000');
}

describe('Spec y pruebas de contrato alineadas', () => {
  test('openapi.yaml está en la versión 1.0.0 bajo /api/v1', () => {
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.servers.map((s) => s.url)).toEqual(expect.arrayContaining([expect.stringMatching(/\/api\/v1$/)]));
  });

  test('el catálogo tiene las 17 operaciones del contrato', () => {
    expect(OPERACIONES).toHaveLength(17);
    expect(new Set(OPERACIONES.map((o) => o.operationId)).size).toBe(17);
  });

  test.each(OPERACIONES.map((o) => [o.operationId, o.metodo.toUpperCase(), o.ruta]))(
    '%s (%s %s) tiene router asignado y prueba de contrato',
    (operationId, metodo, ruta) => {
      const router = routerDeRuta(ruta);
      expect(['salud', ...ROUTERS_DE_NEGOCIO]).toContain(router);
      expect(TEXTO_PRUEBAS).toContain(`'${operationId}'`);
    }
  );

  test('el validador soporta todas las palabras de esquema que usa la spec', () => {
    expect(palabrasNoSoportadas()).toEqual([]);
  });

  test('cada error de la spec usa el status que el manejador asigna a su codigo', () => {
    const inconsistencias = [];
    for (const { operationId, operacion } of OPERACIONES) {
      for (const [status, respuesta] of Object.entries(operacion.responses)) {
        if (Number(status) < 400 || !respuesta.$ref) continue;
        const nombre = respuesta.$ref.split('/').pop();
        const contenido = spec.components.responses[nombre].content['application/json'];
        const ejemplos = contenido.examples
          ? Object.values(contenido.examples).map((e) => e.value)
          : [contenido.example];
        for (const ejemplo of ejemplos) {
          const codigo = ejemplo.error.codigo;
          if (STATUS_POR_CODIGO[codigo] !== Number(status)) {
            inconsistencias.push(`${operationId} ${status}: ${codigo} → ${STATUS_POR_CODIGO[codigo]}`);
          }
        }
      }
    }
    expect(inconsistencias).toEqual([]);
  });
});

describe('X-Sitio obligatorio en todas las operaciones (menos /salud)', () => {
  const ctx = crearContexto();
  const conSitio = OPERACIONES.filter((o) => o.ruta !== '/salud');

  test.each(conSitio.map((o) => [o.operationId, o.metodo, o.ruta]))(
    '%s sin X-Sitio → 400 SOLICITUD_INVALIDA con detalles.campo',
    async (operationId, metodo, ruta) => {
      const res = await ctx.pedir(metodo, rutaConcreta(ruta));
      esperarError(operationId, res, 400, 'SOLICITUD_INVALIDA', { campo: 'X-Sitio' });
    }
  );

  test.each(conSitio.map((o) => [o.operationId, o.metodo, o.ruta]))(
    '%s con X-Sitio desconocido → 400',
    async (operationId, metodo, ruta) => {
      const res = await ctx.pedir(metodo, rutaConcreta(ruta), { sitio: 'web_3' });
      esperarError(operationId, res, 400, 'SOLICITUD_INVALIDA', { campo: 'X-Sitio' });
    }
  );
});

describe('Ruta fuera del contrato (escenario de «Pruebas de contrato»)', () => {
  const ctx = crearContexto();

  test.each([
    ['delete', '/eventos/evt-suegra'],
    ['get', '/no-existe'],
    ['put', '/reservas/00000000-0000-4000-8000-000000000000'],
  ])('%s %s → 404 NO_ENCONTRADO con el esquema Error', async (metodo, ruta) => {
    const res = await ctx.pedir(metodo, ruta, { sitio: 'web_1' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { codigo: 'NO_ENCONTRADO', mensaje: expect.any(String) } });
  });

  test('una operación existente responde según la spec aunque falte su router', async () => {
    // Sin router todavía, el 404 genérico también cumple el contrato (NoEncontrado).
    const res = await ctx.pedir('get', '/eventos/no-existe', { sitio: 'web_1' });
    esperarContrato('obtenerEvento', res, 404);
  });
});

describe('Routers pendientes', () => {
  const pendientes = ROUTERS_DE_NEGOCIO.filter((n) => !routerExiste(n));

  if (modoEstricto()) {
    test('con CONTRATO_ESTRICTO=1 todos los routers deben existir', () => {
      expect(pendientes).toEqual([]);
    });
  }

  for (const nombre of pendientes) {
    test.todo(`app/rutas/${nombre}.js (sus pruebas de contrato están omitidas hasta que exista)`);
  }
  if (pendientes.length === 0) test('todos los routers de negocio existen', () => expect(pendientes).toEqual([]));
});
