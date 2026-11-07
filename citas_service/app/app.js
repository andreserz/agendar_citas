'use strict';

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

const { enviarError } = require('./errores');

function cargarSpec(rutaSpec) {
  return YAML.parse(fs.readFileSync(rutaSpec, 'utf8'));
}

/**
 * Crea la aplicación Express sin abrir el puerto, para poder probarla con Supertest.
 * Los endpoints de negocio se agregan en el router de `/api/v1` conforme existan en la spec.
 */
function crearApp(config, repos) {
  const app = express();
  app.disable('x-powered-by');

  // Repositorios disponibles para las rutas (ADR-002). Las pruebas pueden inyectar los suyos.
  app.locals.repos = repos;

  // CORS sólo para los orígenes configurados (PR9).
  app.use(cors({ origin: [...config.corsOrigenes] }));
  app.use(express.json());

  // Contrato y documentación (PR5): Swagger UI en /docs a partir de openapi.yaml.
  const spec = cargarSpec(config.rutaSpec);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

  // API versionada. Spec primero: aquí sólo se montan rutas definidas en openapi.yaml.
  const api = express.Router();
  app.use(config.rutaBase, api);

  // Ruta inexistente.
  app.use((req, res) => {
    enviarError(res, 404, 'NO_ENCONTRADO', 'El recurso solicitado no existe.');
  });

  // Manejador de errores: JSON mal formado → 400; cualquier otro → 500 sin exponer detalles.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return enviarError(res, 400, 'SOLICITUD_INVALIDA', 'El cuerpo de la petición no es JSON válido.');
    }
    if (config.entorno !== 'test') console.error(err);
    return enviarError(res, 500, 'ERROR_INTERNO', 'Ocurrió un error inesperado.');
  });

  return app;
}

module.exports = { crearApp };
