'use strict';

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

const { enviarError } = require('./errores');
const { crearValidarSitio } = require('./middlewares/validar-sitio');
const { crearAutenticarComprador } = require('./middlewares/autenticar-comprador');
const { crearBuscadorDeRutas } = require('./middlewares/rutas-contrato');
const { crearManejadorErrores } = require('./middlewares/errores');
const { crearRouter: crearRouterSalud } = require('./rutas/salud');
const { montarRouters } = require('./rutas');

// Reloj por defecto: la hora del sistema. Las pruebas inyectan uno fijo (RNF06).
const relojDelSistema = () => new Date();

function cargarSpec(rutaSpec) {
  return YAML.parse(fs.readFileSync(rutaSpec, 'utf8'));
}

/**
 * Crea la aplicación Express sin abrir el puerto, para poder probarla con Supertest.
 * Los endpoints de negocio se agregan en el router de `/api/v1` conforme existan en la spec.
 */
function crearApp(config, repos, reloj = relojDelSistema) {
  const app = express();
  app.disable('x-powered-by');

  // Repositorios y reloj disponibles para las rutas (ADR-002, ADR-003). Las pruebas pueden inyectar los suyos.
  app.locals.repos = repos;
  app.locals.reloj = reloj;

  // CORS sólo para los orígenes configurados (PR9).
  app.use(cors({ origin: [...config.corsOrigenes] }));
  app.use(express.json());

  // Contrato y documentación (PR5): Swagger UI en /docs a partir de openapi.yaml.
  const spec = cargarSpec(config.rutaSpec);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

  // API versionada. Spec primero: aquí sólo se montan rutas definidas en openapi.yaml.
  // Orden (design §2): cors → json → salud → validarSitio → routers de negocio → 404 → errores.
  const api = express.Router();
  const autenticarComprador = crearAutenticarComprador({
    sitiosRepo: repos && repos.sitiosRepo,
    jwtSecret: config.jwtSecret,
    reloj,
  });
  const dependencias = { repos, reloj, config, autenticarComprador };
  api.use(crearRouterSalud(dependencias)); // GET /salud no requiere X-Sitio.
  api.use(crearValidarSitio({ esRutaDelContrato: crearBuscadorDeRutas(spec) }));
  montarRouters(api, dependencias);
  app.use(config.rutaBase, api);

  // Ruta inexistente.
  app.use((req, res) => {
    enviarError(res, 404, 'NO_ENCONTRADO', 'El recurso solicitado no existe.');
  });

  // Manejador de errores: traduce ErrorRepositorio y códigos de la base de datos (tabla del contrato).
  app.use(crearManejadorErrores({ entorno: config.entorno }));

  return app;
}

module.exports = { crearApp };
