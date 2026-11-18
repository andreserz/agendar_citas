# Proposal — impl-service

## Why

`citas_service` tiene repositorios en memoria y 58 pruebas en verde, pero ninguna ruta de negocio montada. Los sitios no pueden integrarse hasta que la API exista con el contrato exacto. Este change define esa API, la seguridad de compradores y la integración con SQL Server, sin depender de acuerdos previos.

## What Changes

- Montar todas las rutas de `/api/v1` del contrato compartido, con validación de `X-Sitio`.
- Agregar autenticación de compradores con JWT (8 horas) y hash scrypt calculado en el servicio.
- Aplicar la regla por sitio: `web_1` exige token; `web_2` compra sin token.
- Corregir la liberación de reservas vencidas: responde `410 RESERVA_VENCIDA` y no libera.
- Hacer obligatorio el límite de 10 asientos para `web_1`.
- Agregar el adaptador SQL Server que llama solo a procedimientos (`REPOSITORIO=sql`).
- Traducir los `THROW` de la base de datos con la tabla del contrato.
- Actualizar `openapi.yaml` a `1.0.0` con las mismas rutas, formas y errores.
- **BREAKING** para cualquier cliente que use el borrador v0.1: `resultadoSimulado` desaparece y las rutas de búsqueda y reportes se agregan.

## Capabilities

### New Capabilities
- `service-api-http`: rutas, encabezado `X-Sitio`, formas de respuesta y traducción de errores del servicio como API pública.

### Modified Capabilities
- `service-reservas`: el requisito «Liberar reserva» cambia (vencida ya no se libera) y el límite pasa a ser obligatorio para `web_1`.
- `service-autenticacion`: registro, login, JWT y sitios sin cuenta cambian de pendientes a definidos.

## Impact

- `citas_service/app/` (rutas, middleware, adaptador SQL), `citas_service/tests/`, `citas_service/docs/specs/openapi.yaml`, `citas_service/.env.example`.
- Depende de los procedimientos y códigos del change `impl-backend`; los llama tal como están definidos en el contrato.
- Los sitios consumen esta API en su versión `1.0.0`.
