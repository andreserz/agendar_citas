'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Routers por dominio (design §1). Cada archivo de `app/rutas/` exporta
 * `crearRouter({ repos, reloj, config, autenticarComprador })` y devuelve un `express.Router` con
 * rutas relativas a `/api/v1` (por ejemplo `router.post('/reservas', ...)`).
 *
 * En los controladores:
 * - `req.sitio` trae el `X-Sitio` ya validado (`web_1` o `web_2`); pásenlo al dominio, por ejemplo
 *   `reservasRepo.obtener(id, reloj(), { sitio: req.sitio })`.
 * - En las rutas de comprador («Según sitio» o «Sí (web_1)» en el contrato) agreguen el middleware:
 *   `router.post('/reservas', autenticarComprador, controlador)`. Deja `req.compradorId` (web_1, con
 *   token válido; si no, responde 401) y `req.requiereComprador` (true en web_1, false en web_2).
 * - `reloj()` devuelve la fecha actual (en pruebas, la fecha fija que se inyecte).
 * - Los errores se pasan con `throw` o `next(err)`; el manejador central los traduce.
 *
 * Se monta cada archivo que exista. Así R y D solo agregan su archivo y nadie edita `app.js`.
 * `salud` no está aquí porque se monta antes de `validarSitio`.
 */
const ROUTERS_DE_NEGOCIO = Object.freeze(['catalogo', 'reservas', 'pagos', 'ordenes', 'reportes', 'auth']);

function montarRouters(api, dependencias, nombres = ROUTERS_DE_NEGOCIO) {
  const montados = [];
  for (const nombre of nombres) {
    const archivo = path.join(__dirname, `${nombre}.js`);
    if (!fs.existsSync(archivo)) continue;
    const { crearRouter } = require(archivo);
    if (typeof crearRouter !== 'function') {
      throw new TypeError(`app/rutas/${nombre}.js debe exportar crearRouter({ repos, reloj, config }).`);
    }
    api.use(crearRouter(dependencias));
    montados.push(nombre);
  }
  return montados;
}

module.exports = { montarRouters, ROUTERS_DE_NEGOCIO };
