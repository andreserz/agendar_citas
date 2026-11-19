## MODIFIED Requirements

### Requirement: Integración con la API
La configuración SHALL estar en `app/config.js` y poder sobrescribirse con `window.CITAS_CONFIG`. Los valores son: `apiBaseUrl = "http://localhost:3000/api/v1"`, `sitio = "web_1"`, `modo` (`auto`, `demo` o `api`), `tiempoEsperaMs = 2200`, `respaldoDemoAutomatico = true`, `maxAsientos = 10` y `duracionReservaSegundos = 300`.

Cada petición SHALL enviar `Accept: application/json` y `X-Sitio: web_1`. Las rutas de comprador (`POST /reservas`, `GET /reservas`, `GET /reservas/{id}`, `DELETE /reservas/{id}`, `POST /reservas/{id}/pago`, `GET /ordenes`, `GET /ordenes/{id}`) SHALL enviar `Authorization: Bearer <token>`.

El cliente SHALL usar exactamente las rutas y formas del contrato compartido. El pago SHALL leer `{ resultado, simulado, reserva, orden? }`; no existe ya ningún campo `resultadoSimulado`.

En modo `auto`, si el servicio no responde, la app SHALL pasar a demo y mostrar un aviso visible («Modo demo: el servicio no responde») que permanezca mientras dure la sesión. En modo `api`, si el servicio no responde, la app SHALL mostrar el error y NO SHALL cambiar a demo.

#### Scenario: Servicio apagado
- **WHEN** `citas_service` no responde
- **THEN** la app sigue funcionando en modo demo y avisa de ello

#### Scenario: Servicio disponible
- **WHEN** `modo = "auto"` y `GET /api/v1/salud` responde `200`
- **THEN** la app usa el modo `api` y no muestra el aviso de demo

#### Scenario: Servicio apagado en modo auto
- **WHEN** `modo = "auto"` y el servicio no responde antes de `tiempoEsperaMs`
- **THEN** la app usa demo y muestra el aviso visible

#### Scenario: Servicio apagado en modo api
- **WHEN** `modo = "api"` y el servicio no responde
- **THEN** la app muestra el error de conexión y no cambia a demo

#### Scenario: Pago en modo api
- **WHEN** el pago responde `201` con `resultado = "rechazado"`
- **THEN** la reserva sigue `activa` en la interfaz y el comprador puede reintentar
