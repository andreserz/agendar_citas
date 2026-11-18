# plataforma-contrato-compartido

## Purpose

Reglas que comparten las cuatro capas del monorepo `agendar_citas`: `citas_backend` (base de datos), `citas_service` (API), `citas_web_1` y `citas_web_2` (sitios). Fuente: `citas_service/docs/specs/ACUERDOS.md` (decisiones D1–D14 y propuestas PR1–PR9), `citas_service/docs/specs/openapi.yaml` (borrador 0.1.0) y `citas_backend/docs/BCK_ESPECIFICACION.md`.

Estado general: los acuerdos D1–D14 están vigentes. Las propuestas PR1, PR3, PR4, PR5, PR7, PR9 y PR8 siguen pendientes de confirmación de `citas_web_1`. Ningún requisito de esta capacidad se considera completo hasta que el servicio monte sus rutas HTTP.

## Requirements

### Requirement: Puertos y orígenes locales
Todas las capas SHALL ejecutarse en la misma máquina (D12) con puertos fijos: `citas_service` en `3000`, `citas_web_1` en `5501` y `citas_web_2` en `5502`. La URL base de la API SHALL ser `http://localhost:3000/api/v1`.

**Estado:** implementado en `citas_service/app/config.js` (valores por defecto). `citas_web_1` lo consume en `app/config.js`. Pendiente la confirmación de `citas_web_1` y del backend (PR8).

#### Scenario: Puerto por defecto del servicio
- **WHEN** se inicia `citas_service` sin la variable `PORT`
- **THEN** el servicio escucha en el puerto `3000` y la base de la API es `/api/v1`

#### Scenario: Puerto inválido
- **WHEN** `PORT` tiene un valor que no es un entero entre 0 y 65535
- **THEN** la configuración falla con un error que indica el valor recibido

### Requirement: Orígenes permitidos (CORS)
El servicio SHALL aceptar peticiones desde el navegador solo desde `http://localhost:5501`, `http://127.0.0.1:5501`, `http://localhost:5502` y `http://127.0.0.1:5502`. La lista SHALL poder cambiarse con la variable `CORS_ORIGINS`.

**Estado:** implementado en `app/app.js` con el paquete `cors` (PR9).

#### Scenario: Origen no permitido
- **WHEN** una petición llega desde un origen fuera de la lista configurada
- **THEN** el navegador no recibe la cabecera `Access-Control-Allow-Origin` correspondiente

### Requirement: Identificación del sitio consumidor
Toda petición a `/api/v1` SHALL incluir el encabezado `X-Sitio` con el identificador del sitio (`web_1`, `web_2`). Los valores válidos se toman de la configuración de sitios. Si el encabezado falta, la respuesta SHALL ser `400 SOLICITUD_INVALIDA`.

**Estado:** pendiente. `citas_service/app` no valida `X-Sitio`; el cliente de `citas_web_1` ya lo envía (PR5).

#### Scenario: Petición sin sitio
- **WHEN** una petición a `/api/v1/eventos` no incluye `X-Sitio`
- **THEN** la respuesta es `400` con `error.codigo = "SOLICITUD_INVALIDA"`

### Requirement: Formato único de error
Toda respuesta de error SHALL usar el cuerpo `{ "error": { "codigo", "mensaje", "detalles"? } }`. El `codigo` SHALL ser estable y en mayúsculas; el `mensaje` SHALL estar en español y ser apto para mostrarse al usuario. El cuerpo NUNCA SHALL incluir datos de otro comprador (RN09).

**Estado:** implementado en `app/errores.js` y en los manejadores de `app/app.js` (404 para rutas inexistentes, 400 para JSON mal formado, 500 sin detalles).

#### Scenario: Ruta inexistente
- **WHEN** se solicita una ruta que no está en la API
- **THEN** la respuesta es `404` con `error.codigo = "NO_ENCONTRADO"`

#### Scenario: Error interno
- **WHEN** ocurre una excepción no prevista
- **THEN** la respuesta es `500` con `error.codigo = "ERROR_INTERNO"` y sin trazas ni datos internos

### Requirement: Catálogo de códigos de error y su estado HTTP
La API SHALL responder con los siguientes pares de estado HTTP y código, definidos en `citas_service/docs/ESPECIFICACION.md` §4:

| HTTP | `codigo` |
| --- | --- |
| 400 | `SOLICITUD_INVALIDA` |
| 401 | `NO_AUTENTICADO` |
| 404 | `NO_ENCONTRADO` |
| 409 | `ASIENTO_NO_DISPONIBLE`, `RESERVA_PAGADA` |
| 410 | `RESERVA_VENCIDA`, `RESERVA_LIBERADA` |
| 422 | `LIMITE_EXCEDIDO` |
| 500 | `ERROR_INTERNO` |

El código `CORREO_REGISTRADO` (registro con correo ya existente) proviene del backend (`51002`) y SHALL agregarse a esta tabla cuando se publique el módulo de autenticación.

#### Scenario: Conflicto de disponibilidad
- **WHEN** al apartar uno o más asientos ya están apartados o comprados
- **THEN** la respuesta es `409` con `error.codigo = "ASIENTO_NO_DISPONIBLE"` y `error.detalles.asientoIds` con los asientos en conflicto

#### Scenario: Reserva expirada
- **WHEN** se intenta pagar o liberar una reserva cuyo `expiraEn` ya pasó
- **THEN** la respuesta es `410` con `error.codigo = "RESERVA_VENCIDA"`

### Requirement: Traducción de errores de la base de datos
El servicio SHALL traducir los errores `THROW` de los procedimientos del backend por rango de número, sin exponer el número al cliente (D10, ADR-004 del backend):

| Rango | HTTP | `codigo` |
| --- | --- | --- |
| 51000–51999 | 409 | `ASIENTO_NO_DISPONIBLE` o `RESERVA_PAGADA` (según el código exacto) |
| 52000–52999 | 410 | `RESERVA_VENCIDA` |
| 53000–53999 | 422 | `LIMITE_EXCEDIDO` o `SOLICITUD_INVALIDA` (según el código exacto) |
| 54000–54999 | 404 | `NO_ENCONTRADO` |
| 50000 y el código `53004` | 500 | `ERROR_INTERNO` |

**Estado:** pendiente. Depende del adaptador a SQL Server (`citas_backend` Etapa 5 y ADR-004 del servicio, pendiente).

#### Scenario: Código 53004
- **WHEN** un procedimiento lanza `53004` porque el servicio envió un `@ExpiraEn` no posterior a `@Ahora`
- **THEN** la respuesta es `500` con `ERROR_INTERNO`, porque es un fallo del servicio y no del cliente (QB5)

### Requirement: Fechas y zona horaria
Las fechas SHALL guardarse en UTC en la base de datos. La API SHALL entregar horarios de funciones y vencimientos con desplazamiento explícito de Ciudad de México (`America/Mexico_City`, UTC−6 todo el año), por ejemplo `2026-11-12T19:00:00-06:00` (D13).

**Estado:** los repositorios en memoria trabajan con `Date` en UTC. La conversión en la capa de API está pendiente porque aún no hay rutas.

#### Scenario: Horario de función
- **WHEN** se consulta una función a las 19:00 hora de CDMX
- **THEN** el campo `inicio` contiene `-06:00` como desplazamiento

### Requirement: Moneda
Cada precio SHALL viajar con su `moneda`. Hoy el valor es `MXN` para ambos sitios (web_2 lo confirmó en PR #8), pero el código SHALL leerlo de la función y no asumirlo (A.4 del backend).

#### Scenario: Total de reserva
- **WHEN** se crea una reserva
- **THEN** `total` es la suma de los precios de los asientos y `moneda` es la de la función

### Requirement: La especificación manda sobre el código
Ningún endpoint SHALL implementarse sin existir antes en `citas_service/docs/specs/openapi.yaml`. Si el código y la spec difieren, la spec SHALL corregirse primero. Los cambios de contrato se acuerdan con el equipo consumidor y se registran en `ACUERDOS.md` antes de editar el OpenAPI (AGENTS.md del servicio, §2).

**Estado:** el OpenAPI está en borrador v0.1.0 con operaciones marcadas `x-estado: borrador`. Pendientes en la spec: reemplazar `resultadoSimulado` por las tarjetas de prueba (D14), ejemplos `ORD-000123` y código de 12 caracteres, y la compra sin cuenta de web_2 (P15).

#### Scenario: Operación sin spec
- **WHEN** se quiere agregar una ruta que no existe en `openapi.yaml`
- **THEN** primero se agrega a la spec y se registra el acuerdo, y después se implementa

## Discrepancias detectadas

- `openapi.yaml` sigue con `resultadoSimulado` en el pago, reemplazado por D14 en la especificación.
- Los archivos de `citas_web_1` y `citas_web_2` todavía usan `apartado`/`comprado` (servicio y web_1) y `apartada`/`vendida` (web_2). El mapeo debe quedar explícito en el adaptador de web_2.
- D7 dice «14,400 asientos por función», pero 120 funciones × 120 asientos son 14,400 asientos-función en total. Hay que corregir la redacción en `ACUERDOS.md`.
