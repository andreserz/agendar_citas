/* Configuración pública de web_2; no incluir secretos en el navegador. */
window.CITAS_CONFIG = Object.assign(
  {
    apiBaseUrl: 'http://localhost:3000/api/v1',
    swaggerUrl: 'http://localhost:3000/docs',
    sitio: 'web_2',
    modo: 'auto', // auto | demo | api
    tiempoEsperaMs: 2200,
    duracionReservaSegundos: 300,
  },
  window.CITAS_CONFIG || {}
);
