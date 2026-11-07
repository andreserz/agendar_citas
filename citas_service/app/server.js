'use strict';

// Carga variables desde .env si existe (sólo para desarrollo local; nunca se sube al repositorio).
require('dotenv').config({ quiet: true });

const { cargarConfig } = require('./config');
const { crearApp } = require('./app');
const { crearRepos } = require('./repos');

const config = cargarConfig();
const app = crearApp(config, crearRepos(config));

app.listen(config.puerto, () => {
  console.log(`citas_service escuchando en http://localhost:${config.puerto}${config.rutaBase}`);
  console.log(`Swagger UI en http://localhost:${config.puerto}/docs`);
});
