import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

const HEX = /#([0-9a-fA-F]{3,8})\b/g;
const RGB = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g;

// Una familia «roja» es la que gira entre 0° y 25° o entre 335° y 360°,
// con saturación suficiente para leerse como color y sin ser casi negro.
const SAT_MIN = 0.15;
const LUM_MIN = 0.15;
const HUE_ROJO_MAX = 25;
const HUE_ROJO_MIN = 335;

function aRgb(hexa) {
  const limpio = hexa.replace('#', '');
  const hex = limpio.length === 3
    ? limpio.split('').map((c) => c + c).join('')
    : limpio.slice(0, 6);
  if (hex.length !== 6) return null;
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function aHsl([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function esRojo(rgb) {
  const { h, s, l } = aHsl(rgb);
  if (s < SAT_MIN || l < LUM_MIN) return false;
  return h <= HUE_ROJO_MAX || h >= HUE_ROJO_MIN;
}

function coloresRojos(texto) {
  const encontrados = [];
  for (const coincidencia of texto.matchAll(HEX)) {
    const rgb = aRgb(coincidencia[1]);
    if (rgb && esRojo(rgb)) encontrados.push(coincidencia[0]);
  }
  for (const coincidencia of texto.matchAll(RGB)) {
    const rgb = [1, 2, 3].map((i) => Number(coincidencia[i]));
    if (esRojo(rgb)) encontrados.push(coincidencia[0]);
  }
  return encontrados;
}

function luminancia([r, g, b]) {
  const lineal = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lineal[0] + 0.7152 * lineal[1] + 0.0722 * lineal[2];
}

function contraste(primero, segundo) {
  const a = luminancia(primero);
  const b = luminancia(segundo);
  const claro = Math.max(a, b);
  const oscuro = Math.min(a, b);
  return (claro + 0.05) / (oscuro + 0.05);
}

function tokenCss(css, nombre) {
  const coincidencia = css.match(new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{3,8})`));
  assert.ok(coincidencia, `falta el token --${nombre} en :root`);
  return aRgb(coincidencia[1]);
}

test('la hoja de estilos de web_1 no conserva colores de la familia roja', () => {
  const css = readFileSync(join(RAIZ, 'app/css/styles.css'), 'utf8');
  const rojos = coloresRojos(css);
  assert.deepEqual(rojos, [], `quedan colores rojos: ${rojos.join(', ')}`);
});

test('los degradados SVG en línea no conservan colores de la familia roja', () => {
  const archivos = [
    'app/js/ui.js',
    'app/js/views/home.js',
    'app/js/views/cartelera.js',
    'app/js/views/checkout.js',
    'app/js/views/cuenta.js',
    'app/js/views/orden.js',
    'app/js/layout.js',
  ];
  for (const archivo of archivos) {
    const texto = readFileSync(join(RAIZ, archivo), 'utf8');
    const rojos = coloresRojos(texto);
    assert.deepEqual(rojos, [], `${archivo} conserva colores rojos: ${rojos.join(', ')}`);
  }
});

test('la paleta declara un verde de acento, uno de éxito y uno de alerta', () => {
  const css = readFileSync(join(RAIZ, 'app/css/styles.css'), 'utf8');
  const acento = tokenCss(css, 'verde-acento');
  const exito = tokenCss(css, 'verde-claro');
  const alerta = tokenCss(css, 'verde-alerta');
  assert.notDeepEqual(acento, exito);
  assert.notDeepEqual(acento, alerta);
  assert.notDeepEqual(exito, alerta);
  assert.match(css, /--verde-oscuro:/);
  assert.doesNotMatch(css, /--coral/);
  assert.doesNotMatch(css, /--rojo/);
});

test('los verdes cumplen el contraste mínimo AA sobre el fondo nocturno', () => {
  const css = readFileSync(join(RAIZ, 'app/css/styles.css'), 'utf8');
  const fondo = tokenCss(css, 'fondo');
  for (const nombre of ['verde-acento', 'verde-claro', 'verde-alerta']) {
    const verde = tokenCss(css, nombre);
    const ratio = contraste(verde, fondo);
    assert.ok(ratio >= 4.5, `--${nombre} contrasta ${ratio.toFixed(2)}:1 con el fondo`);
  }
  const textoOscuro = aRgb('06281a');
  const ratio = contraste(textoOscuro, tokenCss(css, 'verde-acento'));
  assert.ok(ratio >= 4.5, `el texto sobre el verde de acento contrasta ${ratio.toFixed(2)}:1`);
});
