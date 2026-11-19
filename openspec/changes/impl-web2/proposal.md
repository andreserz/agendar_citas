# Proposal — impl-web2

## Why

`citas_web_2` solo tiene la Definición en borrador. Sin `app/` no hay sitio del cineclub. Este change lo construye sobre el contrato compartido, para que `web_2` se integre con el servicio sin acordar nada con otros equipos.

## What Changes

- Crear la SPA del cineclub en `citas_web_2/app/` (HTML5, CSS3 y JavaScript vanilla, responsiva, glassmorphism).
- Cubrir RF01 a RF11 de la Definición: cartelera, mapa de 80 butacas por sala, selección con rechazo completo, reserva de 5 minutos, pago simulado, confirmación con QR, recuperación por folio y conteo diario.
- Integrarse con el contrato `1.0.0` con `X-Sitio: web_2` y sin token.
- Configurar el puerto `5502` y la URL de la API.
- Completar la Propuesta (paleta y tipografías) como parte de este change, dentro de `citas_web_2/docs/`.
- Crear `citas_web_2/tests/`.

## Capabilities

### New Capabilities
- `web2-integracion-contrato`: cómo la SPA del cineclub usa la API en modo sin cuenta, incluida la recuperación por folio y el reporte diario.

### Modified Capabilities
- Ninguna. `web2-cineclub` (Definición) sigue siendo la base de requisitos y no cambia.

## Impact

- `citas_web_2/app/`, `citas_web_2/tests/`, `citas_web_2/docs/` (Propuesta, Especificación) y `citas_web_2/TODOLIST.md`.
- No depende de otros equipos: la API y la semilla vienen del contrato.
