# service-catalogo

## Purpose

Catálogo de eventos, funciones, zonas y asientos que `citas_service` expone a los sitios. Fuente: `citas_service/docs/DEFINICION.md` (RF01–RF03), `citas_service/docs/ESPECIFICACION.md` §3.4 y §3.5, `citas_service/docs/specs/openapi.yaml` (tag Catálogo) y `citas_backend/docs/BCK_ESPECIFICACION.md` §6.1–§6.6 (SP03–SP06).

Estado general: lógica implementada en el repositorio en memoria (`AsientosRepo` en `citas_service/app/repos/memoria/asientos-repo-memoria.js`) y cubierta por pruebas de contrato (`tests/repos/contrato-repos.js`). Las rutas HTTP `/eventos`, `/funciones` y `/funciones/{id}/asientos` **no están montadas** en `app/app.js`.

## Requirements

### Requirement: Listar eventos
El servicio SHALL devolver los eventos activos. El catálogo no requiere comprador. El evento incluye `id`, `sitio`, `nombre`, `descripcion` opcional y `recinto` opcional.

**Estado:** repositorio implementado (`listarEventos`). Ruta `GET /eventos` pendiente.

#### Scenario: Catálogo de web_1
- **WHEN** `web_1` consulta `GET /eventos`
- **THEN** la respuesta incluye la obra «¡Que no se entere la suegra!» con `sitio = "web_1"`

### Requirement: Obtener evento
El servicio SHALL devolver un evento por su `id`. Si no existe, responde `404 NO_ENCONTRADO`.

**Estado:** repositorio implementado (`obtenerEvento`). Ruta pendiente.

#### Scenario: Evento inexistente
- **WHEN** se consulta un `eventoId` que no existe
- **THEN** la respuesta es `404` con `error.codigo = "NO_ENCONTRADO"`

### Requirement: Listar funciones de un evento
El servicio SHALL devolver solo las funciones activas del evento, ordenadas de la más antigua a la más reciente por `inicio`. Si el evento no existe, responde `404`.

**Estado:** repositorio implementado (`listarFunciones`), probado. Ruta `GET /eventos/{eventoId}/funciones` pendiente.

#### Scenario: Funciones ordenadas
- **WHEN** un evento tiene funciones a las 21:00 y a las 15:00 del mismo día
- **THEN** la respuesta lista primero la de las 15:00

#### Scenario: Función inactiva
- **WHEN** una función está marcada como inactiva
- **THEN** no aparece en la lista

### Requirement: Obtener función y sus zonas
El servicio SHALL devolver una función por `id` y, para cada zona, su nombre y su precio **en esa función** (D9, PreciosZonaFuncion). La función no reporta asientos disponibles como campo fijo: el estado se consulta por asiento.

**Estado:** repositorio implementado (`obtenerFuncion`, `listarZonas`). Rutas `GET /funciones/{funcionId}` pendiente.

#### Scenario: Precio por zona
- **WHEN** se consulta la función `F1` del evento de web_1
- **THEN** la zona Preferente tiene precio `800`, General `500` y Balcón `300`, en MXN

### Requirement: Listar asientos con estado calculado
El servicio SHALL devolver todos los asientos de la función con `id`, `zonaId`, `fila`, `numero`, `etiqueta`, `precio` y `estado`. El estado se calcula en el momento de la consulta a partir de la hora `ahora`:

- `comprado` si el asiento tiene boleto.
- `apartado` si tiene una reserva `activa` con `expiraEn > ahora`.
- `disponible` en cualquier otro caso.

La respuesta NO SHALL revelar quién aparta ni quién compra (RF03). Si la función no existe, responde `404`.

**Estado:** repositorio implementado y probado (incluye la comparación estricta: en `ahora == expiraEn` el asiento está disponible). Ruta `GET /funciones/{funcionId}/asientos` pendiente.

#### Scenario: Asiento vence en el momento exacto
- **WHEN** una reserva tiene `expiraEn = T0 + 300 s` y se consulta el asiento en `T0 + 300 s`
- **THEN** el asiento aparece como `disponible`

#### Scenario: Consulta sin revelar comprador
- **WHEN** un asiento está apartado por otro comprador
- **THEN** la respuesta muestra `estado = "apartado"` sin ningún identificador de comprador

### Requirement: Una sola fuente de estado de asiento
El backend SHALL devolver el `Estado` ya calculado (SP06, D9). Cuando exista la base de datos, el adaptador SHALL mapear `Disponible`/`Apartado`/`Vendido` a `disponible`/`apartado`/`comprado` y SHALL usar la misma regla de `expiraEn > ahora` que el repositorio en memoria.

**Estado:** pendiente hasta el adaptador SQL Server.

#### Scenario: Mismo resultado en memoria y en base de datos
- **WHEN** se consulta el mismo estado de asientos en ambas implementaciones con el mismo `ahora`
- **THEN** los estados coinciden

## Discrepancias y pendientes

- Los sitios usan nombres de estado distintos: el servicio y web_1 usan `apartado`/`comprado`; web_2 (`DEFINICION.md`) usa «apartada»/«vendida». No es un error del servicio, pero el sitio debe mapearlo.
- web_2 necesita sala, formato, idioma, clasificación y duración en la función (P16). El modelo actual no tiene esos campos.
