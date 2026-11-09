#!/usr/bin/env node
'use strict';

/**
 * Servidor estático mínimo (sin dependencias) para la demo de citas_web_1.
 * Uso: node tools/serve.js  (o npm start)
 * Variables: PORT (5501 por defecto), HOST (127.0.0.1 por defecto).
 */

import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('../app', import.meta.url)));
const puerto = Number(process.env.PORT || 5501);
const host = process.env.HOST || '127.0.0.1';

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function dentroDeRaiz(ruta) {
  return ruta === raiz || ruta.startsWith(raiz + sep);
}

const servidor = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let rutaRelativa = decodeURIComponent(url.pathname);
    if (rutaRelativa.endsWith('/')) rutaRelativa += 'index.html';
    let ruta = resolve(join(raiz, normalize(rutaRelativa)));

    if (!dentroDeRaiz(ruta)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Acceso denegado');
      return;
    }

    // Las rutas del SPA usan hash, pero si alguien entra a /algo devolvemos la app.
    if (!existsSync(ruta) || statSync(ruta).isDirectory()) {
      if (extname(ruta)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Recurso no encontrado');
        return;
      }
      ruta = join(raiz, 'index.html');
    }

    const tipo = tipos[extname(ruta).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': tipo,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    createReadStream(ruta).pipe(res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Error interno del servidor de demo');
    console.error(error);
  }
});

servidor.listen(puerto, host, () => {
  console.log(`citas_web_1 demo: http://${host}:${puerto}`);
  console.log(`Directorio servido: ${raiz}`);
});
