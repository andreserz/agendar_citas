'use strict';

/**
 * Apoyo de las pruebas de contrato (tarea 7.1): lee `docs/specs/openapi.yaml` y valida
 * respuestas reales de Supertest contra lo que la spec declara para cada operación.
 *
 * El validador cubre sólo las palabras de JSON Schema que usa nuestra spec (`$ref`, `allOf`,
 * `type`, `required`, `properties`, `additionalProperties`, `enum`, `minimum`, `minLength`,
 * `pattern`, `format`, `items`, `minItems`, `maxItems`, `uniqueItems`). Si la spec empieza a
 * usar otra, `PALABRAS_SOPORTADAS` hace fallar la prueba de cobertura para que se agregue aquí.
 */
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const RUTA_SPEC = path.join(__dirname, '..', '..', '..', 'docs', 'specs', 'openapi.yaml');
const spec = YAML.parse(fs.readFileSync(RUTA_SPEC, 'utf8'));

const METODOS = ['get', 'post', 'put', 'patch', 'delete'];

const PALABRAS_SOPORTADAS = Object.freeze([
  '$ref', 'allOf', 'type', 'required', 'properties', 'additionalProperties', 'enum', 'minimum',
  'minLength', 'pattern', 'format', 'items', 'minItems', 'maxItems', 'uniqueItems', 'default',
  'description', 'example', 'examples',
]);

const FORMATOS = Object.freeze({
  'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^/,
});

/** Lista de operaciones: `{ metodo, ruta, operationId, operacion }`. */
function operaciones() {
  const lista = [];
  for (const [ruta, definicion] of Object.entries(spec.paths || {})) {
    for (const metodo of METODOS) {
      if (definicion[metodo]) {
        lista.push({ metodo, ruta, operationId: definicion[metodo].operationId, operacion: definicion[metodo] });
      }
    }
  }
  return lista;
}

function operacionPorId(operationId) {
  const op = operaciones().find((o) => o.operationId === operationId);
  if (!op) throw new Error(`La operación "${operationId}" no está en openapi.yaml.`);
  return op;
}

function resolverRef(ref) {
  if (!ref.startsWith('#/')) throw new Error(`Sólo se soportan $ref locales: ${ref}`);
  return ref
    .slice(2)
    .split('/')
    .reduce((nodo, parte) => {
      if (!nodo || !(parte in nodo)) throw new Error(`$ref no encontrado en openapi.yaml: ${ref}`);
      return nodo[parte];
    }, spec);
}

const resolver = (nodo) => (nodo && nodo.$ref ? resolver(resolverRef(nodo.$ref)) : nodo);

function tipoDe(valor) {
  if (valor === null) return 'null';
  if (Array.isArray(valor)) return 'array';
  if (typeof valor === 'number') return Number.isInteger(valor) ? 'integer' : 'number';
  return typeof valor;
}

function cumpleTipo(esperado, valor) {
  const real = tipoDe(valor);
  return real === esperado || (esperado === 'number' && real === 'integer');
}

/** Valida `valor` contra `esquema` y devuelve la lista de errores (vacía si cumple). */
function validarEsquema(esquema, valor, ruta = '$') {
  const errores = [];
  const s = resolver(esquema);
  if (!s) return errores;

  for (const sub of s.allOf || []) errores.push(...validarEsquema(sub, valor, ruta));

  if (s.type && !cumpleTipo(s.type, valor)) {
    errores.push(`${ruta}: se esperaba ${s.type} y llegó ${tipoDe(valor)}`);
    return errores;
  }
  if (s.enum && !s.enum.includes(valor)) {
    errores.push(`${ruta}: ${JSON.stringify(valor)} no está en ${JSON.stringify(s.enum)}`);
  }

  if (typeof valor === 'string') {
    if (s.minLength !== undefined && valor.length < s.minLength) errores.push(`${ruta}: menos de ${s.minLength} caracteres`);
    if (s.pattern && !new RegExp(s.pattern).test(valor)) errores.push(`${ruta}: "${valor}" no cumple ${s.pattern}`);
    if (s.format && FORMATOS[s.format] && !FORMATOS[s.format].test(valor)) {
      errores.push(`${ruta}: "${valor}" no tiene formato ${s.format}`);
    }
  }
  if (typeof valor === 'number' && s.minimum !== undefined && valor < s.minimum) {
    errores.push(`${ruta}: ${valor} es menor que ${s.minimum}`);
  }

  if (Array.isArray(valor)) {
    if (s.minItems !== undefined && valor.length < s.minItems) errores.push(`${ruta}: menos de ${s.minItems} elementos`);
    if (s.maxItems !== undefined && valor.length > s.maxItems) errores.push(`${ruta}: más de ${s.maxItems} elementos`);
    if (s.uniqueItems && new Set(valor.map((v) => JSON.stringify(v))).size !== valor.length) {
      errores.push(`${ruta}: tiene elementos repetidos`);
    }
    if (s.items) valor.forEach((v, i) => errores.push(...validarEsquema(s.items, v, `${ruta}[${i}]`)));
  }

  if (tipoDe(valor) === 'object' && (s.properties || s.required || s.additionalProperties !== undefined)) {
    for (const campo of s.required || []) {
      if (!(campo in valor)) errores.push(`${ruta}.${campo}: falta (requerido)`);
    }
    for (const [campo, v] of Object.entries(valor)) {
      const propiedad = s.properties && s.properties[campo];
      if (propiedad) errores.push(...validarEsquema(propiedad, v, `${ruta}.${campo}`));
      else if (s.additionalProperties === false) errores.push(`${ruta}.${campo}: campo no definido en la spec`);
    }
  }
  return errores;
}

/**
 * Valida una respuesta de Supertest contra la operación de la spec:
 * - el status está declarado en `responses` de la operación;
 * - si la spec declara cuerpo JSON, el cuerpo cumple su esquema;
 * - si no declara cuerpo (por ejemplo `204`), la respuesta llega vacía.
 * Devuelve la lista de errores.
 */
function validarRespuesta(operationId, res) {
  const { operacion } = operacionPorId(operationId);
  const status = String(res.status);
  const declarada = operacion.responses[status] || operacion.responses.default;
  if (!declarada) {
    return [`status ${status} no está declarado en ${operationId} (${Object.keys(operacion.responses).join(', ')})`];
  }
  const respuesta = resolver(declarada);
  const json = respuesta.content && respuesta.content['application/json'];
  if (!json) {
    return res.text ? [`${operationId} ${status} no declara cuerpo y llegó: ${res.text.slice(0, 80)}`] : [];
  }
  if (!/application\/json/.test(res.headers['content-type'] || '')) {
    return [`${operationId} ${status} debe responder application/json`];
  }
  return validarEsquema(json.schema, res.body);
}

/** Palabras de esquema que aparecen en la spec y que el validador no soporta. */
function palabrasNoSoportadas() {
  const encontradas = new Set();
  const nombresDePropiedades = new WeakSet();
  (function recorrer(nodo) {
    if (Array.isArray(nodo)) return nodo.forEach(recorrer);
    if (!nodo || typeof nodo !== 'object') return;
    if (nodo.properties) nombresDePropiedades.add(nodo.properties);
    for (const [clave, valor] of Object.entries(nodo)) {
      if (!nombresDePropiedades.has(nodo)) encontradas.add(clave);
      // Los ejemplos son datos, no esquema: no se recorren.
      if (!['example', 'examples', 'default', 'enum'].includes(clave)) recorrer(valor);
    }
  })(spec.components.schemas);
  const nombresDeEsquemas = new Set(Object.keys(spec.components.schemas));
  return [...encontradas].filter((p) => !PALABRAS_SOPORTADAS.includes(p) && !nombresDeEsquemas.has(p));
}

module.exports = {
  spec,
  operaciones,
  operacionPorId,
  validarEsquema,
  validarRespuesta,
  palabrasNoSoportadas,
};
