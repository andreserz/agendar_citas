#!/usr/bin/env node
'use strict';

import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(fileURLToPath(new URL('../app', import.meta.url)));
const puerto = Number(process.env.PORT || 5502);
const host = process.env.HOST || '127.0.0.1';
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function dentroDeRaiz(ruta) {
  return ruta === raiz || ruta.startsWith(`${raiz}${sep}`);
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
    if (!existsSync(ruta) || statSync(ruta).isDirectory()) {
      if (extname(ruta)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Recurso no encontrado');
        return;
      }
      ruta = join(raiz, 'index.html');
    }
    res.writeHead(200, {
      'Content-Type': tipos[extname(ruta).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    });
    createReadStream(ruta).pipe(res);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Solicitud no válida');
  }
});

servidor.listen(puerto, host, () => {
  console.log(`citas_web_2: http://${host}:${puerto}`);
  console.log(`Directorio servido: ${raiz}`);
});
