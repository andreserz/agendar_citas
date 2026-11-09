/*
 * Configuración pública del sitio (no contiene secretos).
 * Se puede sobrescribir antes de cargar la app con window.CITAS_CONFIG.
 *
 * modo:
 *   - "auto"  → intenta la API y, si no responde, usa la demo local.
 *   - "demo"  → siempre datos locales (útil para probar sin backend).
 *   - "api"   → sólo API; si falla, muestra errores y permite cambiar a demo.
 */
window.CITAS_CONFIG = Object.assign(
  {
    apiBaseUrl: 'http://localhost:3000/api/v1',
    swaggerUrl: 'http://localhost:3000/docs',
    sitio: 'web_1',
    modo: 'auto',
    tiempoEsperaMs: 2200,
    respaldoDemoAutomatico: true,
    maxAsientos: 10,
    duracionReservaSegundos: 300,
  },
  window.CITAS_CONFIG || {}
);
