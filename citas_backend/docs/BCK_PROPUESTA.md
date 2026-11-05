# BCK — Propuesta: modelo de datos y procedimientos almacenados

| Campo | Valor |
| --- | --- |
| Proyecto | `citas_backend`: base de datos para reservar y comprar boletos |
| Etapa | 2. Propuesta |
| Estado | **Aprobado** por el usuario el 5 nov 2026 |
| Fecha | 5 de noviembre de 2026 |
| Fuentes | `docs/BCK_ANTEPROYECTO.md` (aprobado), `citas_service/docs/specs/contrato-datos-backend.md`, `citas_service/docs/specs/ACUERDOS.md` (versión del 4 nov), `citas_web_1/docs/DEFINICION.md`, entrevista del 5 nov 2026 |

---

## 1. Objetivo de esta etapa

1. Proponer el modelo de datos (tablas, columnas principales y restricciones) que se detallará en la Definición.
2. Proponer la lista de procedimientos almacenados (SP) para que el usuario la apruebe, como pide `promt.md`.
3. Responder las preguntas que el servicio dejó al backend, que vencen el **vie 6 nov**: P3, P6 y P11–P14.

## 2. Decisiones de la entrevista (5 nov 2026)

| # | Tema | Decisión | Responde a |
| --- | --- | --- | --- |
| E9 | Precio | **Por zona y función**: tabla `PreciosZonaFuncion`. Se cargan los mismos precios de web_1 en las 120 funciones (Preferente $800, General $500 y Balcón $300 MXN). | P14 |
| E10 | Estado del asiento | `spAsientos_ListarPorFuncion` **recibe `@Ahora`** y devuelve `Estado` (`Disponible`, `Apartado` o `Vendido`) junto con `ExpiraEn`. | P11 |
| E11 | Asientos que fallaron | `spReservas_Crear` deshace la transacción, **devuelve un conjunto de resultados** con los `IdAsiento` que fallaron y luego lanza `THROW 51001`. | P13 |
| E12 | Códigos de error | **Rangos por tipo** (ver §5), y cada rango corresponde a un código HTTP del servicio. | P12 |
| E13 | Datos iniciales | El backend carga los datos de web_1 en `05_datos_iniciales.sql`. | P3 |

## 3. Modelo de datos propuesto

Convenciones (E5): tablas en plural y columnas en PascalCase. Toda tabla tiene `Id` con `IDENTITY(1,1)` y `FechaRegistro DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()`. Los catálogos además tienen `Descripcion NVARCHAR(100)` y `Activo BIT NOT NULL DEFAULT 1`. Las fechas de negocio están en UTC (E6).

### 3.1 Catálogos

| Tabla | Columnas principales | Restricciones | Datos iniciales |
| --- | --- | --- | --- |
| `Sitios` | `Id`, `Clave` (`web_1`, `web_2`), `Descripcion`, `Activo` | `UQ_Sitios_Clave` | `web_1` |
| `Zonas` | `Id`, `IdSitio`, `Descripcion`, `Activo` | `FK` a `Sitios`; `UQ` (`IdSitio`, `Descripcion`) | Preferente, General, Balcón |
| `EstadosReserva` | `Id`, `Descripcion`, `Activo` | `UQ` en `Descripcion` | Activa, Liberada, Pagada |
| `ResultadosPago` | `Id`, `Descripcion`, `Activo` | `UQ` en `Descripcion` | Aprobado, Rechazado |

### 3.2 Entidades

| Tabla | Columnas principales | Restricciones |
| --- | --- | --- |
| `Compradores` | `Id`, `Nombre`, `Correo`, `HashContrasena` (E3) | `UQ_Compradores_Correo` |
| `Eventos` | `Id`, `IdSitio`, `Nombre`, `Descripcion`, `Activo` | `FK` a `Sitios` |
| `Funciones` | `Id`, `IdEvento`, `FechaHoraInicio` (UTC), `Activo` | `FK` a `Eventos`; `UQ` (`IdEvento`, `FechaHoraInicio`) |
| `Asientos` | `Id`, `IdZona`, `Fila` (`A`–`L`), `Numero`, `Etiqueta` (columna calculada `Fila + Numero`, por ejemplo `A7`, que es la etiqueta visible del contrato), `Activo` | `FK` a `Zonas`; `UQ` (`IdZona`, `Fila`, `Numero`) |
| `PreciosZonaFuncion` | `Id`, `IdFuncion`, `IdZona`, `Precio DECIMAL(10,2)`, `Moneda CHAR(3)` (`MXN`) | `UQ` (`IdFuncion`, `IdZona`); `CK` `Precio >= 0` |

### 3.3 Transacciones

| Tabla | Columnas principales | Restricciones |
| --- | --- | --- |
| `AsientosFuncion` | `Id`, `IdFuncion`, `IdAsiento`, `IdReservaActual` (NULL), `ExpiraEn` (NULL), `Vendido BIT` | `UQ` (`IdFuncion`, `IdAsiento`) |
| `Reservas` | `Id`, `IdComprador`, `IdSitio`, `IdFuncion`, `IdEstadoReserva`, `CreadaEn`, `ExpiraEn`, `Total` | `FK` a cada catálogo y entidad; `CK` `ExpiraEn > CreadaEn` |
| `ReservasAsientos` | `Id`, `IdReserva`, `IdAsiento`, `PrecioTomado` | `UQ` (`IdReserva`, `IdAsiento`) |
| `IntentosPago` | `Id`, `IdReserva`, `IdResultadoPago`, `FechaIntento` | `FK` a `Reservas` y a `ResultadosPago` |
| `Ordenes` | `Id`, `Folio` (número visible), `IdReserva`, `IdComprador`, `IdSitio`, `Total`, `FechaCompra` | `UQ_Ordenes_Folio`; `UQ_Ordenes_IdReserva` (una orden por reserva) |
| `Boletos` | `Id`, `IdOrden`, `IdFuncion`, `IdAsiento`, `Precio`, `Codigo` | `UQ_Boletos_Codigo`; **`UQ` (`IdFuncion`, `IdAsiento`)**: no se puede vender dos veces un asiento |
| `BitacoraErrores` | `Id`, `Procedimiento`, `NumeroError`, `Mensaje`, `Linea` | Uso interno; al cliente sólo le llega un mensaje genérico |

### 3.4 Técnica de concurrencia propuesta (para aprobar)

La tabla `AsientosFuncion` tiene una fila por asiento y función (120 × 120 = 14,400 filas). Así se aplica el patrón que sugiere el contrato (garantía 1):

```sql
UPDATE AsientosFuncion
   SET IdReservaActual = @IdReserva, ExpiraEn = @ExpiraEn
 WHERE IdFuncion = @IdFuncion
   AND IdAsiento IN (/* asientos solicitados */)
   AND Vendido = 0
   AND (ExpiraEn IS NULL OR ExpiraEn <= @Ahora);
-- Si @@ROWCOUNT <> número de asientos solicitados → ROLLBACK, devolver los que fallaron y THROW 51001
```

- La actualización condicionada bloquea las filas, así que si dos peticiones llegan al mismo tiempo sólo una puede apartar el asiento.
- El estado «vencida» no se guarda (PR1): un apartado con `ExpiraEn <= @Ahora` se considera libre.
- La restricción `UQ (IdFuncion, IdAsiento)` de `Boletos` es una segunda defensa contra la doble venta.
- **Alternativa** si no se aprueba: no crear `AsientosFuncion` y validar sobre `ReservasAsientos` con `UPDLOCK, HOLDLOCK`. Hay menos tablas, pero se bloquean más filas y las consultas son más complejas.

### 3.5 Diagrama preliminar

```
Sitios ─┬─< Zonas ─┬─< Asientos ──< AsientosFuncion >── Funciones >── Eventos >── Sitios
        │          └─< PreciosZonaFuncion >──────────────┘
        │
Compradores ─< Reservas ─┬─< ReservasAsientos
                         ├─< IntentosPago
                         └── Ordenes ─< Boletos
```

El diagrama entidad-relación formal irá en `docs/architecture/` durante la Definición.

### 3.6 Índices propuestos (volumen y consultas frecuentes del contrato)

El contrato dice que las consultas más frecuentes son «asientos de una función» y «asientos de un comprador en una función». El volumen de web_1 es de 14,400 asientos-función.

| Índice | Tabla y columnas | Para qué consulta |
| --- | --- | --- |
| `UQ_AsientosFuncion_Funcion_Asiento` | `AsientosFuncion (IdFuncion, IdAsiento)` INCLUDE (`Vendido`, `ExpiraEn`, `IdReservaActual`) | Asientos de una función (SP06) y apartado condicionado (SP07) |
| `IX_Reservas_Comprador_Funcion` | `Reservas (IdComprador, IdFuncion, IdEstadoReserva)` INCLUDE (`ExpiraEn`) | Asientos de un comprador en una función (SP07, SP09 y SP10) |
| `IX_Boletos_Orden` | `Boletos (IdOrden)` | Boletos de una orden (SP14) |
| `IX_Ordenes_Comprador` | `Ordenes (IdComprador)` INCLUDE (`FechaCompra`, `Total`) | Órdenes de un comprador (SP15) |
| `IX_Funciones_Evento` | `Funciones (IdEvento, FechaHoraInicio)` | Funciones de un evento (SP04) |
| `IX_Reservas_Estado_ExpiraEn` | `Reservas (IdEstadoReserva, ExpiraEn)` | Barrido opcional de limpieza (SP17) |

Además de estos, cada `UQ` de §3.1–§3.3 crea su propio índice. Para `Boletos (IdFuncion, IdAsiento)`, ese índice también sirve para contar los asientos comprados (SP10).

### 3.7 Persistencia (garantía 5 del contrato)

Toda operación confirmada (`COMMIT`) queda en el registro de transacciones de SQL Server, así que no se pierde al reiniciar. Los datos de negocio no se guardan en tablas temporales ni en tablas en memoria. El modelo de recuperación `SIMPLE` basta para la ejecución local, porque no se piden respaldos.

## 4. Procedimientos almacenados propuestos (para aprobar)

Todos usan `SET NOCOUNT ON`, `SET XACT_ABORT ON`, `TRY/CATCH`, registro en `BitacoraErrores` y `THROW`. Los que dependen del tiempo reciben `@Ahora DATETIME2` (E7). Las listas de asientos llegan como **arreglo JSON en `NVARCHAR(MAX)`** y se leen con `OPENJSON`, que el driver `mssql` de Node maneja más fácil que un parámetro de tabla.

| # | Procedimiento | Qué hace | Tiempo | Transacción |
| --- | --- | --- | --- | --- |
| SP01 | `spCompradores_Registrar` | Da de alta a un comprador con nombre, correo y hash | — | — |
| SP02 | `spCompradores_ObtenerPorCorreo` | Devuelve el comprador con su hash para iniciar sesión | — | — |
| SP03 | `spEventos_Listar` | Devuelve los eventos activos de un sitio | — | — |
| SP04 | `spFunciones_ListarPorEvento` | Devuelve las funciones activas de un evento | — | — |
| SP05 | `spFunciones_Obtener` | Devuelve una función con su evento | — | — |
| SP06 | `spAsientos_ListarPorFuncion` | Devuelve cada asiento con su zona, precio, `Estado` y `ExpiraEn` (E10) | `@Ahora` | — |
| SP07 | `spReservas_Crear` | Aparta todos los asientos o ninguno, guarda el precio y valida el máximo de 10 (E11) | `@Ahora` | Sí |
| SP08 | `spReservas_Obtener` | Devuelve una reserva con sus asientos y si está vencida | `@Ahora` | — |
| SP09 | `spReservas_ListarActivasPorComprador` | Devuelve las reservas vigentes de un comprador | `@Ahora` | — |
| SP10 | `spReservas_ContarAsientosCompradorFuncion` | Cuenta los asientos apartados vigentes y los comprados de un comprador en una función | `@Ahora` | — |
| SP11 | `spReservas_Liberar` | Marca la reserva como liberada y libera sus asientos | — | Sí |
| SP12 | `spIntentosPago_Registrar` | Registra un intento de pago **rechazado** | `@Ahora` | — |
| SP13 | `spOrdenes_Pagar` | Sólo si la reserva sigue `Activa` y `ExpiraEn > @Ahora` (garantía 2): registra el intento aprobado, crea la orden y los boletos con código único, marca la reserva como pagada y los asientos como vendidos | `@Ahora` | Sí |
| SP14 | `spOrdenes_Obtener` | Devuelve una orden con sus boletos | — | — |
| SP15 | `spOrdenes_ListarPorComprador` | Devuelve las órdenes de un comprador | — | — |
| SP16 | `spBoletos_Consolidar` | Devuelve los boletos con comprador, asiento, función, fecha y monto (backoffice) | — | — |
| SP17 | `spReservas_LimpiarVencidas` (**opcional**) | Barrido de limpieza del contrato: marca como `Liberada` las reservas `Activa` con `ExpiraEn <= @Ahora` y suelta sus asientos. No cambia ninguna regla, porque una reserva vencida ya se considera libre. | `@Ahora` | Sí |

Sobre el máximo de 10 (PR4): el servicio lo valida, y `spReservas_Crear` lo vuelve a validar dentro de la transacción. Así, dos reservas simultáneas del mismo comprador no pueden pasar del límite.

## 5. Códigos de error `THROW` (E12)

Los rangos ya quedan fijos. Los códigos individuales son preliminares y se cierran en la Especificación.

| Rango | HTTP en el servicio | Significado | Códigos preliminares |
| --- | --- | --- | --- |
| 51000–51999 | `409` Conflicto | Recurso no disponible o duplicado | 51001 asientos no disponibles · 51002 correo ya registrado · 51003 la reserva ya está pagada o liberada |
| 52000–52999 | `410` Ya no existe | Reserva vencida | 52001 la reserva venció (`ExpiraEn <= @Ahora`) |
| 53000–53999 | `422` Regla incumplida | Regla de negocio o parámetro inválido | 53001 supera el máximo de 10 asientos por persona y función · 53002 lista de asientos vacía o inválida · 53003 asiento que no pertenece a la función |
| 54000–54999 | `404` No encontrado | El registro no existe o está inactivo | 54001 función · 54002 reserva · 54003 orden · 54004 comprador |
| 50000 | `500` Error interno | Error no previsto; se registra en `BitacoraErrores` | — |

## 6. Trazabilidad con el contrato de datos

Fuente: `citas_service/docs/specs/contrato-datos-backend.md`. Cada punto del contrato tiene dónde cubrirse. El diccionario de datos completo, columna por columna, irá en `BCK_DEFINICION.md` (P6).

### 6.1 Entidades y campos

| Entidad del contrato | Campos del contrato | Tabla y columnas propuestas |
| --- | --- | --- |
| Sitio | identificador, nombre (`web_1`, `web_2`) | `Sitios.Id`, `Sitios.Clave`, `Sitios.Descripcion` |
| Comprador | identificador, nombre, correo único, hash | `Compradores.Id`, `Nombre`, `Correo` (UQ), `HashContrasena` |
| Evento | identificador, nombre, descripción, sitio | `Eventos.Id`, `Nombre`, `Descripcion`, `IdSitio` |
| Función | identificador, evento, fecha y hora de inicio | `Funciones.Id`, `IdEvento`, `FechaHoraInicio` (UTC, P8) |
| Zona | identificador, nombre, precio por función, moneda | `Zonas.Id`, `Zonas.Descripcion` y `PreciosZonaFuncion.Precio`, `Moneda` (E9) |
| Asiento | identificador, zona, etiqueta visible | `Asientos.Id`, `IdZona`, `Fila`, `Numero`, `Etiqueta` |
| Reserva | identificador, comprador, sitio, función, estado, `creada_en`, `expira_en`, total | `Reservas.Id`, `IdComprador`, `IdSitio`, `IdFuncion`, `IdEstadoReserva` (catálogo `EstadosReserva`: `activa` → Activa, `liberada` → Liberada, `pagada` → Pagada), `CreadaEn`, `ExpiraEn`, `Total` |
| Asiento de reserva | reserva, asiento, precio tomado | `ReservasAsientos.IdReserva`, `IdAsiento`, `PrecioTomado` |
| Intento de pago | identificador, reserva, resultado, fecha | `IntentosPago.Id`, `IdReserva`, `IdResultadoPago` (`aprobado` → Aprobado, `rechazado` → Rechazado), `FechaIntento` |
| Orden | identificador o número visible, reserva, comprador, sitio, total, fecha de compra | `Ordenes.Id`, `Folio`, `IdReserva`, `IdComprador`, `IdSitio`, `Total`, `FechaCompra` |
| Boleto | identificador, orden, asiento, función, precio, código único | `Boletos.Id`, `IdOrden`, `IdAsiento`, `IdFuncion`, `Precio`, `Codigo` (UQ) |

### 6.2 Garantías

| # | Garantía del contrato | Cómo se cumple |
| --- | --- | --- |
| 1 | Apartado atómico: falla completo, dice qué asientos fallaron y sólo una de dos peticiones simultáneas gana | Actualización condicionada sobre `AsientosFuncion` dentro de una transacción (§3.4), con el conjunto de resultados y `THROW 51001` (E11) |
| 2 | Pago exitoso atómico, sólo si la reserva sigue activa y no vencida | SP13 en una sola transacción; si no se cumple, lanza 51003 o 52001 |
| 3 | La hora la manda el servicio | Parámetro `@Ahora` en SP06–SP10, SP12, SP13 y SP17 (E7) |
| 4 | Unicidad de asiento por función en boletos, de códigos de boleto y de correos | `UQ (IdFuncion, IdAsiento)` y `UQ (Codigo)` en `Boletos`, y `UQ (Correo)` en `Compradores` |
| 5 | Persistencia | Tablas permanentes de SQL Server con `COMMIT` (§3.7) |

### 6.3 Operaciones

| Repositorio | Operación del contrato | SP |
| --- | --- | --- |
| `AsientosRepo` | Listar eventos · listar funciones de un evento · obtener una función | SP03 · SP04 · SP05 |
| `AsientosRepo` | Listar los asientos de una función con zona, precio y estado | SP06 |
| `ReservasRepo` | Crear una reserva con sus asientos y precios | SP07 |
| `ReservasRepo` | Obtener una reserva con sus asientos | SP08 |
| `ReservasRepo` | Listar las reservas activas de un comprador | SP09 |
| `ReservasRepo` | Contar los asientos de un comprador en una función (regla de 10) | SP10 |
| `ReservasRepo` | Marcar una reserva como liberada | SP11 |
| `ReservasRepo` | Registrar un intento de pago | SP12 (rechazado) y SP13 (aprobado) |
| `OrdenesRepo` | Pagar una reserva | SP13 |
| `OrdenesRepo` | Obtener una orden con sus boletos · listar las órdenes de un comprador | SP14 · SP15 |
| `OrdenesRepo` | Listar boletos para consolidación | SP16 |
| (nota del contrato) | Barrido opcional de limpieza | SP17 (opcional) |
| Cuentas (E3) | Registro e inicio de sesión | SP01 · SP02 |

### 6.4 Volumen y datos iniciales

| Punto del contrato | Cobertura |
| --- | --- |
| 120 funciones (jue, vie y sáb a las 15:00, 19:00 y 21:00, de oct a dic 2026) × 120 asientos = 14,400 | `AsientosFuncion` con 14,400 filas, e índices de §3.6 |
| Consultas frecuentes: asientos de una función y asientos de un comprador en una función | `UQ_AsientosFuncion_Funcion_Asiento` e `IX_Reservas_Comprador_Funcion` |
| Obra «¡Que no se entere la suegra!» y zonas Preferente (A–C, $800), General (D–I, $500) y Balcón (J–L, $300), 10 asientos por fila | `05_datos_iniciales.sql`: 30 + 60 + 30 = 120 asientos y 120 × 3 = 360 precios en MXN (E13) |
| Horarios en hora local | Se cargan convertidos a UTC; la regla de conversión se fija en la Definición (P8) |

## 7. Respuestas para el servicio (P3, P6, P11–P14)

| # | Respuesta del backend |
| --- | --- |
| P3 | Sí: el backend carga los datos iniciales de web_1 (1 evento, 120 funciones, 3 zonas, 120 asientos, 360 precios) en `05_datos_iniciales.sql`. Los de web_2 se cargarán cuando se responda P4. |
| P6 | El diccionario de datos va en `BCK_DEFINICION.md` y el diagrama en `citas_backend/docs/architecture/`. **Cambios:** las columnas nuevas las agrega el backend con un script numerado nuevo (sin editar los anteriores), avisa en el chat y actualiza el diccionario. Si el servicio necesita una columna, la pide en el chat. |
| P11 | `spAsientos_ListarPorFuncion` recibe `@Ahora` y devuelve `Estado` (`Disponible`, `Apartado` o `Vendido`) y `ExpiraEn`. El servicio no tiene que calcular el estado. |
| P12 | Rangos por tipo: 51xxx → `409`, 52xxx → `410`, 53xxx → `422`, 54xxx → `404` y 50000 → `500`. La lista final de códigos se publica en `BCK_ESPECIFICACION.md`. |
| P13 | `spReservas_Crear` devuelve primero un conjunto de resultados con `IdAsiento` y `Motivo` (`Vendido` o `Apartado`) y después lanza `THROW 51001`. Los mismos Id van también en el texto del mensaje, como respaldo (ver riesgo R1). |
| P14 | El precio va por zona y función (`PreciosZonaFuncion`), con los mismos montos de web_1 en todas las funciones. |

## 8. Mensaje propuesto para el chat del grupo

> **Backend → Servicio (respuestas P3, P6, P11–P14):**
> P3: sí, el backend carga los datos de web_1 en `05_datos_iniciales.sql`.
> P6: el diccionario de datos va en `BCK_DEFINICION.md` y el diagrama en `citas_backend/docs/architecture/`. Si se agrega una columna, se hace con un script nuevo numerado y se avisa por aquí. Si ustedes necesitan una, pídanla en este chat.
> P11: `spAsientos_ListarPorFuncion` recibe `@Ahora` y devuelve `Estado` (Disponible/Apartado/Vendido) y `ExpiraEn`.
> P12: los códigos `THROW` van por rangos: 51xxx = 409, 52xxx = 410, 53xxx = 422, 54xxx = 404 y 50000 = 500.
> P13: `spReservas_Crear` devuelve un SELECT con los asientos que fallaron y luego `THROW 51001`; los Id también van en el mensaje.
> P14: el precio va por zona y función.
> Las listas de asientos se envían como arreglo JSON en un parámetro `NVARCHAR(MAX)`. Detalle en `citas_backend/docs/BCK_PROPUESTA.md`.

## 9. Riesgos de esta propuesta

| # | Riesgo | Mitigación |
| --- | --- | --- |
| R1 | Algunos drivers (por ejemplo `mssql` de Node) descartan los conjuntos de resultados cuando la petición termina en error. En ese caso el servicio no vería los asientos que fallaron. | Los Id también van en el texto del `THROW` (por ejemplo `Asientos no disponibles: 12,15`). En las pruebas de integración se confirma cuál de las dos formas lee el servicio. |
| R2 | `AsientosFuncion` debe crearse para cada función nueva. | `05_datos_iniciales.sql` la llena con las 120 funciones. Si después se agregan funciones, se llenará junto con ellas (se define en la Especificación). |
| R3 | Las fechas de entrega son vie 6 nov (respuestas) y sáb 7 nov (scripts). | Aprobar esta propuesta hoy y hacer la Definición y la Especificación de forma compacta. |
| R4 | web_2 (P4) sigue sin definirse. | El modelo es genérico (E4) y `Sitios` y `Zonas` ya permiten otro negocio. |

## 10. Puntos que el usuario debe aprobar

1. El modelo de datos de §3, incluida la tabla `AsientosFuncion` (§3.4) en lugar de la alternativa, y los índices de §3.6.
2. La lista SP01–SP17 de §4 (SP17 es opcional), con las listas de asientos en JSON.
3. Los rangos de error de §5.
4. El mensaje para el chat de §8.

## 11. Siguiente etapa

Cuando se apruebe, se pasará a **3. Definición** (`BCK_DEFINICION.md`): requisitos, reglas de negocio y diccionario de datos con la equivalencia de cada campo del contrato, más el diagrama entidad-relación y los ADR en `docs/architecture/`.
