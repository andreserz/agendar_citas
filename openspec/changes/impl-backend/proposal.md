# Proposal — impl-backend

## Why

`citas_backend` tiene el diseño aprobado (Etapa 4) pero no tiene scripts SQL. Para que `citas_service` y los dos sitios puedan integrarse sin acordar nada más con otros equipos, la base de datos debe exponer exactamente los procedimientos, códigos de error y datos que define el contrato compartido.

## What Changes

- Construir los scripts `app/01_crear_bd.sql` a `app/05_datos_iniciales.sql` (Etapa 5), empezando por SP06, SP07 y SP13.
- Ajustar el esquema y las firmas de procedimientos a las decisiones del contrato: sitios con `RequiereComprador`, compradores opcionales, `UltimosDigitos` en intentos de pago, zonas-sala y campos de función para web_2.
- Separar el código de reserva liberada (`52002`) del de reserva pagada (`51003`), para que el servicio responda `410 RESERVA_LIBERADA`.
- Reemplazar SP18 por `spOrdenes_Buscar` (búsqueda por folio o código) y definir SP19 como `spReservas_ContarPorDia`.
- Cargar la semilla de web_1 y web_2 descrita en el contrato.
- **BREAKING** para `citas_backend` respecto a la Especificación aprobada: las firmas de SP07, SP12, SP13, SP18 y SP19 cambian, y `51003` ya no cubre reservas liberadas.

## Capabilities

### New Capabilities
- `backend-esquema-contrato`: esquema, procedimientos, códigos de error y semilla que la base de datos debe cumplir para el contrato `1.0.0`.

### Modified Capabilities
- Ninguna en `openspec/specs/`. Los requisitos de `backend-base-datos` que contradicen este change quedan reemplazados por `backend-esquema-contrato` hasta que se archive el change.

## Impact

- `citas_backend/app/` (scripts nuevos) y `citas_backend/.env.example` (sin contraseñas reales).
- `citas_service` depende de los nombres de procedimientos y códigos de este change; lo consume tal como está en el contrato, sin negociar.
- No se modifica ninguna otra carpeta del repositorio.
