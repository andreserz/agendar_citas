# Proposal — impl-web1

## Why

`citas_web_1` está completo en modo demo, pero su cliente de API fue escrito antes del contrato. Para que el sitio funcione con el servicio real, debe alinearse con las rutas, formas y errores del contrato compartido, sin pedir cambios a otros equipos.

## What Changes

- Alinear `app/js/api-client.js` y `app/js/data-service.js` con las rutas y formas del contrato `1.0.0`.
- Enviar `X-Sitio: web_1` y `Authorization` solo en las rutas que lo exigen.
- Leer el pago con la forma `{ resultado, simulado, reserva, orden? }`.
- Mostrar un aviso visible cuando la app esté en modo demo, en lugar de cambiar de modo en silencio.
- Hacer que la demo use la misma semilla que el servicio (120 funciones, 3 zonas, 120 asientos).
- Corregir el encabezado heredado de `AGENTS.md` y la sección de zona horaria de su especificación.

## Capabilities

### New Capabilities
- Ninguna.

### Modified Capabilities
- `web1-compra-entradas`: el requisito «Integración con la API» cambia para usar el contrato `1.0.0` y mostrar el modo activo.

## Impact

- `citas_web_1/app/js/`, `citas_web_1/app/config.js`, `citas_web_1/tests/`, `citas_web_1/docs/ESPECIFICACION.md`, `citas_web_1/AGENTS.md`.
- No cambia el diseño visual ni la paleta aprobada.
