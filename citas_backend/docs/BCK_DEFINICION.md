# BCK — Definición: requisitos, reglas de negocio y diccionario de datos

| Campo | Valor |
| --- | --- |
| Proyecto | `citas_backend`: base de datos para reservar y comprar boletos |
| Etapa | 3. Definición |
| Estado | **Aprobado** por el usuario el 5 nov 2026 |
| Fecha | 5 de noviembre de 2026 |
| Responsables | S (requisitos y reglas), A (diccionario y diagrama). Ver `BCK_PLAN_TRABAJO.md` |
| Fuentes | `BCK_ANTEPROYECTO.md` y `BCK_PROPUESTA.md` (aprobados), `citas_service/docs/specs/contrato-datos-backend.md`, `citas_service/docs/specs/ACUERDOS.md`, `citas_web_1/docs/DEFINICION.md`, entrevista del 5 nov 2026 |
| Arquitectura | `docs/architecture/BCK_DIAGRAMA_ER.md` y `docs/architecture/adr/` |

---

## 1. Decisiones de la entrevista (5 nov 2026)

| # | Tema | Decisión |
| --- | --- | --- |
| E14 | Equipo | Sandra (líder), Alfredo (modelo y datos) y Hugo (SP y pruebas). Por ahora Sandra también puede ejecutar las tareas de Alfredo y de Hugo (`BCK_PLAN_TRABAJO.md`). |
| E15 | Vencimiento del apartado | **El servicio envía `@ExpiraEn`** a `spReservas_Crear` junto con `@Ahora`. La regla de 5 minutos vive sólo en el servicio (PR1); la BD sólo valida que `@ExpiraEn > @Ahora`. |
| E16 | Folio y código | Folio de orden legible, `ORD-000123`, calculado a partir del `Id`. Código de boleto de **12 caracteres alfanuméricos aleatorios**, único y difícil de adivinar (el sitio lo dibuja como QR, PR7). |
| E17 | Fechas especiales | Se cargan las **120 funciones** del contrato, incluidas las del 24, 25 y 31 de diciembre. Si alguna se cancela, se marca `Activo = 0` sin borrarla. Se pregunta a web_1 (§8). |
| E18 | Conversión a UTC | `America/Mexico_City` no tiene horario de verano desde 2022, así que la hora local es **UTC−6 todo el año**. Los datos iniciales suman 6 horas fijas (ADR-003). |

## 2. Alcance de la definición

Este documento fija **qué** debe hacer la base de datos (requisitos y reglas) y **con qué datos** (diccionario). El **cómo** de cada procedimiento (parámetros exactos, conjuntos de resultados y códigos finales) se escribe en la Especificación (`BCK_ESPECIFICACION.md`).

## 3. Requisitos funcionales

Cada requisito tiene un identificador `RF-B` y apunta al procedimiento de la Propuesta (SP01–SP17).

| # | Requisito | SP | Prioridad |
| --- | --- | --- | --- |
| RF-B01 | Registrar un comprador con nombre, correo y hash de la contraseña | SP01 | Alta |
| RF-B02 | Obtener un comprador activo por correo, con su hash, para iniciar sesión | SP02 | Alta |
| RF-B03 | Listar los eventos activos de un sitio | SP03 | Alta |
| RF-B04 | Listar las funciones activas de un evento, ordenadas por fecha | SP04 | Alta |
| RF-B05 | Obtener una función con los datos de su evento | SP05 | Media |
| RF-B06 | Listar los asientos de una función con zona, etiqueta, precio, `Estado` y `ExpiraEn` a la hora `@Ahora` | SP06 | **Crítica** |
| RF-B07 | Crear una reserva atómica de 1 a 10 asientos que se aparta completa o falla completa, e indicar qué asientos fallaron | SP07 | **Crítica** |
| RF-B08 | Obtener una reserva con sus asientos y si está vencida a la hora `@Ahora` | SP08 | Alta |
| RF-B09 | Listar las reservas activas y no vencidas de un comprador | SP09 | Media |
| RF-B10 | Contar los asientos de un comprador en una función (apartados vigentes y comprados) | SP10 | Alta |
| RF-B11 | Liberar una reserva activa y devolver sus asientos | SP11 | Alta |
| RF-B12 | Registrar un intento de pago rechazado | SP12 | Media |
| RF-B13 | Pagar una reserva de forma atómica: intento aprobado, orden, boletos, reserva pagada y asientos vendidos | SP13 | **Crítica** |
| RF-B14 | Obtener una orden con sus boletos | SP14 | Alta |
| RF-B15 | Listar las órdenes de un comprador | SP15 | Media |
| RF-B16 | Listar los boletos con comprador, asiento, función, fecha de compra y monto (consolidación) | SP16 | Baja |
| RF-B17 | Limpiar reservas vencidas (opcional) | SP17 | Baja |
| RF-B18 | Cargar los datos iniciales de web_1 | `05_datos_iniciales.sql` | **Crítica** |
| RF-B19 | Registrar internamente los errores no previstos sin exponer detalles al cliente | Todos | Alta |

## 4. Requisitos no funcionales

| # | Requisito |
| --- | --- |
| RNF-B01 | **Motor:** SQL Server 2019 o superior, edición Express o Developer. No se usan funciones de versiones posteriores (D5). |
| RNF-B02 | **Entrega:** scripts `.sql` numerados del `01` al `05` que se ejecutan en orden en SSMS sobre una base vacía, sin errores (E2). |
| RNF-B03 | **Concurrencia:** dos solicitudes simultáneas por el mismo asiento y función nunca terminan ambas con éxito (garantía 1, ADR-002). |
| RNF-B04 | **Atomicidad:** las operaciones que modifican varias tablas (SP07, SP11, SP13 y SP17) usan una transacción con `SET XACT_ABORT ON` y `TRY/CATCH`. |
| RNF-B05 | **Hora de negocio:** las operaciones que dependen del tiempo reciben `@Ahora`; ninguna usa la hora del servidor para decidir vencimientos (garantía 3, ADR-003). |
| RNF-B06 | **Persistencia:** sólo tablas permanentes; lo que se confirma no se pierde al reiniciar (garantía 5). |
| RNF-B07 | **Seguridad:** el servicio se conecta con un usuario que sólo tiene permiso `EXECUTE` sobre los procedimientos (rol `rolCitasServicio`), sin acceso directo a las tablas (D4). No se guardan contraseñas en claro (E3). Ningún archivo del repositorio contiene credenciales. |
| RNF-B08 | **Rendimiento:** con el volumen de web_1 (14,400 asientos-función), SP06 y SP07 responden en menos de 200 ms en una laptop, apoyados en los índices de la Propuesta §3.6. |
| RNF-B09 | **Errores:** códigos `THROW` por rangos (E12). Al cliente se le devuelve un mensaje genérico; el detalle queda en `BitacoraErrores`. |
| RNF-B10 | **Nombres:** español, tablas en plural, columnas en PascalCase y restricciones con prefijo `PK_`, `FK_`, `UQ_`, `CK_`, `DF_` o `IX_` (E5 y `sqlserver-dba`). |
| RNF-B11 | **Sin borrados físicos** en catálogos ni entidades: se usa `Activo = 0`. |

## 5. Reglas de negocio

### 5.1 Estado de un asiento en una función

| # | Regla |
| --- | --- |
| RN01 | El estado se calcula a la hora `@Ahora`, en este orden: **Vendido** si `AsientosFuncion.Vendido = 1`; **Apartado** si `IdReservaActual` no es nulo y `ExpiraEn > @Ahora`; en cualquier otro caso, **Disponible**. |
| RN02 | El estado «vencida» de una reserva **no se guarda**: una reserva `Activa` con `ExpiraEn <= @Ahora` se considera vencida (PR1). Sus asientos vuelven a estar disponibles aunque `AsientosFuncion` todavía apunte a ella. |

### 5.2 Reservas

| # | Regla | Error |
| --- | --- | --- |
| RN03 | La solicitud trae de 1 a 10 asientos, sin repetidos y en un arreglo JSON válido. | 53002 |
| RN04 | Todos los asientos deben pertenecer al sitio y a la función solicitados y estar activos. | 53003 |
| RN05 | La función debe existir, estar activa y pertenecer al sitio de la solicitud. | 54001 |
| RN06 | El comprador debe existir y estar activo. | 54004 |
| RN07 | `@ExpiraEn` debe ser posterior a `@Ahora` (E15). | 53004 |
| RN08 | **Todo o nada:** si algún asiento está Vendido o Apartado, no se aparta ninguno. Se devuelve un conjunto de resultados con `IdAsiento`, `Etiqueta` y `Motivo`, y se lanza el error con los Id también en el texto (E11, R1). | 51001 |
| RN09 | **Límite de 10:** los asientos apartados vigentes del comprador en la función, más sus asientos comprados, más los solicitados, no pueden pasar de 10. Se valida dentro de la misma transacción (PR4). | 53001 |
| RN10 | El precio de cada asiento se toma de `PreciosZonaFuncion` al momento de apartar y se guarda en `ReservasAsientos.PrecioTomado`. `Reservas.Total` es la suma de esos precios. | — |
| RN11 | Al crear la reserva: `CreadaEn = @Ahora`, `ExpiraEn = @ExpiraEn` y estado `Activa`. | — |
| RN12 | Sólo se puede liberar una reserva `Activa`, esté o no vencida. Al liberarla queda `Liberada` y se limpian `IdReservaActual` y `ExpiraEn` en sus filas de `AsientosFuncion`. | 51003 / 54002 |

### 5.3 Pago y órdenes

| # | Regla | Error |
| --- | --- | --- |
| RN13 | Para pagar, la reserva debe existir y estar `Activa`; si ya está `Pagada` o `Liberada` se rechaza. | 54002 / 51003 |
| RN14 | Para pagar, la reserva no debe estar vencida (`ExpiraEn > @Ahora`). | 52001 |
| RN15 | El pago aprobado hace todo en una sola transacción: registra el intento `Aprobado`, crea la orden con `FechaCompra = @Ahora`, crea un boleto por asiento con el `PrecioTomado`, marca la reserva como `Pagada` y deja sus asientos con `Vendido = 1` y `ExpiraEn` en nulo (garantía 2). | — |
| RN16 | Un intento rechazado sólo se registra; la reserva sigue `Activa` para que el comprador pueda reintentar mientras no venza. Una reserva vencida no acepta intentos. | 52001 |
| RN17 | Una reserva genera como máximo una orden (`UQ_Ordenes_IdReserva`). | 51003 |
| RN18 | Un asiento de una función nunca tiene dos boletos (`UQ_Boletos_IdFuncion_IdAsiento`), como segunda defensa contra la doble venta. | 51001 |
| RN19 | **Folio de la orden:** `ORD-` más el `Id` rellenado con ceros a 6 dígitos (por ejemplo `ORD-000123`). Si el `Id` pasa de 999999, se usan todos sus dígitos, sin truncar (E16). | — |
| RN20 | **Código del boleto:** 12 caracteres aleatorios de un alfabeto de 32 símbolos sin caracteres confusos (sin `0`, `O`, `1` ni `I`), generados con `CRYPT_GEN_RANDOM`. Si choca con uno existente, se genera otro (E16). | — |

### 5.4 Compradores

| # | Regla | Error |
| --- | --- | --- |
| RN21 | El correo es único. El servicio lo envía ya en minúsculas y sin espacios, y la intercalación de la BD no distingue mayúsculas, así que `Ana@x.com` y `ana@x.com` son el mismo correo. | 51002 |
| RN22 | La BD sólo recibe y guarda el **hash** de la contraseña; nunca la contraseña en claro (E3). | — |

### 5.5 Generales

| # | Regla |
| --- | --- |
| RN23 | `FechaRegistro` usa `SYSUTCDATETIME()` (auditoría); las fechas de negocio (`CreadaEn`, `ExpiraEn`, `FechaIntento` y `FechaCompra`) usan `@Ahora` (E7). |
| RN24 | Todas las fechas se guardan en UTC. La conversión a `America/Mexico_City` para mostrarlas la hace el servicio (E6). |
| RN25 | Los registros inactivos (`Activo = 0`) no se listan ni se pueden reservar, pero se conservan para el histórico. |
| RN26 | La zona de un precio y la de un asiento deben pertenecer al mismo sitio que el evento de la función. Lo garantizan los datos iniciales y lo valida SP07. |
| RN27 | Cualquier error no previsto se guarda en `BitacoraErrores` y se lanza como `50000` con el mensaje genérico `Error interno`. Los errores de negocio (51000–54999) se vuelven a lanzar con su código y mensaje original. |

### 5.6 Códigos de error definidos

Esta lista amplía la de la Propuesta (§5) con los errores que surgieron en las reglas. La versión final se cierra en la Especificación.

| Código | HTTP | Mensaje (cliente) | Reglas |
| --- | --- | --- | --- |
| 51001 | 409 | Asientos no disponibles: {Ids} | RN08, RN18 |
| 51002 | 409 | El correo ya está registrado | RN21 |
| 51003 | 409 | La reserva ya está pagada o liberada | RN12, RN13, RN17 |
| 52001 | 410 | La reserva venció | RN14, RN16 |
| 53001 | 422 | Supera el máximo de 10 asientos por persona y función | RN09 |
| 53002 | 422 | Lista de asientos vacía, repetida, inválida o de más de 10 | RN03 |
| 53003 | 422 | Asiento que no pertenece a la función | RN04, RN26 |
| 53004 | 422 | La fecha de vencimiento debe ser posterior a la hora actual | RN07 (**nuevo**) |
| 54001 | 404 | Función no encontrada | RN05 |
| 54002 | 404 | Reserva no encontrada | RN12, RN13 |
| 54003 | 404 | Orden no encontrada | SP14 |
| 54004 | 404 | Comprador no encontrado | RN06 |
| 54005 | 404 | Sitio o evento no encontrado | SP03, SP04 (**nuevo**) |
| 50000 | 500 | Error interno | RN27 |

## 6. Diccionario de datos

Convenciones de todas las tablas:
- `Id` con `IDENTITY(1,1)` como `PK_<Tabla>`.
- `FechaRegistro DATETIME2(3) NOT NULL` con `DF_<Tabla>_FechaRegistro = SYSUTCDATETIME()`.
- Los catálogos y las entidades tienen `Activo BIT NOT NULL` con `DF_<Tabla>_Activo = 1`.
- La columna «Contrato» indica el campo equivalente en `contrato-datos-backend.md`.
- **Ajuste a la Propuesta:** `FechaRegistro` y las fechas de negocio pasan de `DATETIME2(0)` a `DATETIME2(3)` (milisegundos), para que la comparación `ExpiraEn > @Ahora` no pierda precisión. `FechaHoraInicio` se queda en `DATETIME2(0)`.
- **Abreviaturas:** N = admite nulos, PK = clave primaria, FK = clave foránea, UQ = valor único, CK = regla de validación, DF = valor por omisión.

### 6.1 Catálogos

**`Sitios`**: los sitios web que usan la base de datos.

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `INT IDENTITY` | No | PK | Identificador | Sitio.identificador |
| `Clave` | `VARCHAR(20)` | No | `UQ_Sitios_Clave` | Clave técnica que envía el servicio (`web_1`) | Sitio.nombre |
| `Descripcion` | `NVARCHAR(100)` | No | — | Nombre visible del negocio | — |
| `Activo` | `BIT` | No | DF 1 | Indicador de activo | — |
| `FechaRegistro` | `DATETIME2(3)` | No | DF | Auditoría | — |

**`Zonas`**: zonas de asientos de un sitio.

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `INT IDENTITY` | No | PK | Identificador | Zona.identificador |
| `IdSitio` | `INT` | No | `FK_Zonas_Sitios` | Sitio al que pertenece | — |
| `Descripcion` | `NVARCHAR(100)` | No | `UQ_Zonas_IdSitio_Descripcion` | Nombre de la zona | Zona.nombre |
| `Activo`, `FechaRegistro` | | | | Convención | — |

**`EstadosReserva`**: estados de una reserva.

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `TINYINT IDENTITY` | No | PK | 1 Activa, 2 Liberada, 3 Pagada | — |
| `Descripcion` | `NVARCHAR(30)` | No | `UQ_EstadosReserva_Descripcion` | Nombre del estado | Reserva.estado (`activa`, `liberada`, `pagada`) |
| `Activo`, `FechaRegistro` | | | | Convención | — |

**`ResultadosPago`**: resultados de un intento de pago.

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `TINYINT IDENTITY` | No | PK | 1 Aprobado, 2 Rechazado | — |
| `Descripcion` | `NVARCHAR(30)` | No | `UQ_ResultadosPago_Descripcion` | Nombre del resultado | Intento.resultado (`aprobado`, `rechazado`) |
| `Activo`, `FechaRegistro` | | | | Convención | — |

### 6.2 Entidades

**`Compradores`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `INT IDENTITY` | No | PK | Identificador | Comprador.identificador |
| `Nombre` | `NVARCHAR(150)` | No | — | Nombre completo | Comprador.nombre |
| `Correo` | `NVARCHAR(254)` | No | `UQ_Compradores_Correo` | Correo en minúsculas (RN21) | Comprador.correo |
| `HashContrasena` | `VARCHAR(255)` | No | — | Hash calculado por el servicio (RN22) | Comprador.contraseña con hash |
| `Activo`, `FechaRegistro` | | | | Convención | — |

**`Eventos`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `INT IDENTITY` | No | PK | Identificador | Evento.identificador |
| `IdSitio` | `INT` | No | `FK_Eventos_Sitios` | Sitio del evento | Evento.sitio |
| `Nombre` | `NVARCHAR(150)` | No | — | Nombre del evento | Evento.nombre |
| `Descripcion` | `NVARCHAR(1000)` | Sí | — | Descripción | Evento.descripción |
| `Activo`, `FechaRegistro` | | | | Convención | — |

**`Funciones`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `INT IDENTITY` | No | PK | Identificador | Función.identificador |
| `IdEvento` | `INT` | No | `FK_Funciones_Eventos` | Evento | Función.evento |
| `FechaHoraInicio` | `DATETIME2(0)` | No | `UQ_Funciones_IdEvento_FechaHoraInicio` | Inicio en UTC (E18) | Función.fecha y hora de inicio |
| `Activo`, `FechaRegistro` | | | | Convención (`Activo = 0` si se cancela, E17) | — |

**`Asientos`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `INT IDENTITY` | No | PK | Identificador | Asiento.identificador |
| `IdZona` | `INT` | No | `FK_Asientos_Zonas` | Zona | Asiento.zona |
| `Fila` | `VARCHAR(3)` | No | `UQ_Asientos_IdZona_Fila_Numero` | Fila (`A`–`L`) | Asiento.etiqueta (fila) |
| `Numero` | `SMALLINT` | No | `CK_Asientos_Numero` (> 0) | Número en la fila | Asiento.etiqueta (número) |
| `Etiqueta` | calculada `PERSISTED` | No | — | `Fila + Numero`, por ejemplo `A7` | Asiento.etiqueta visible |
| `Activo`, `FechaRegistro` | | | | Convención | — |

**`PreciosZonaFuncion`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `INT IDENTITY` | No | PK | Identificador | — |
| `IdFuncion` | `INT` | No | `FK_PreciosZonaFuncion_Funciones`, `UQ_PreciosZonaFuncion_IdFuncion_IdZona` | Función | Zona.precio por función |
| `IdZona` | `INT` | No | `FK_PreciosZonaFuncion_Zonas` | Zona | Zona.precio por función |
| `Precio` | `DECIMAL(10,2)` | No | `CK_PreciosZonaFuncion_Precio` (>= 0) | Precio por asiento | Zona.precio |
| `Moneda` | `CHAR(3)` | No | DF `MXN`, CK `MXN` o `USD` | Moneda ISO 4217 | Zona.moneda |
| `FechaRegistro` | `DATETIME2(3)` | No | DF | Auditoría | — |

### 6.3 Transacciones

**`AsientosFuncion`**: estado de cada asiento en cada función (ADR-002).

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `INT IDENTITY` | No | PK | Identificador | — |
| `IdFuncion` | `INT` | No | `FK_AsientosFuncion_Funciones`, `UQ_AsientosFuncion_IdFuncion_IdAsiento` | Función | — |
| `IdAsiento` | `INT` | No | `FK_AsientosFuncion_Asientos` | Asiento | — |
| `IdReservaActual` | `BIGINT` | Sí | `FK_AsientosFuncion_Reservas` | Reserva que lo aparta o lo compró | Asiento de reserva |
| `ExpiraEn` | `DATETIME2(3)` | Sí | — | Vencimiento del apartado (copia de la reserva) | Reserva.expira_en |
| `Vendido` | `BIT` | No | DF 0 | 1 si ya tiene boleto | Estado «comprado» |
| `FechaRegistro` | `DATETIME2(3)` | No | DF | Auditoría | — |

**`Reservas`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `BIGINT IDENTITY` | No | PK | Identificador | Reserva.identificador |
| `IdComprador` | `INT` | No | `FK_Reservas_Compradores` | Comprador | Reserva.comprador |
| `IdSitio` | `INT` | No | `FK_Reservas_Sitios` | Sitio que la creó | Reserva.sitio |
| `IdFuncion` | `INT` | No | `FK_Reservas_Funciones` | Función | Reserva.función |
| `IdEstadoReserva` | `TINYINT` | No | `FK_Reservas_EstadosReserva` | Estado | Reserva.estado |
| `CreadaEn` | `DATETIME2(3)` | No | — | `@Ahora` al crearla | Reserva.creada_en |
| `ExpiraEn` | `DATETIME2(3)` | No | `CK_Reservas_ExpiraEn` (> `CreadaEn`) | Enviado por el servicio (E15) | Reserva.expira_en |
| `Total` | `DECIMAL(12,2)` | No | `CK_Reservas_Total` (>= 0) | Suma de `PrecioTomado` | Reserva.total |
| `FechaRegistro` | `DATETIME2(3)` | No | DF | Auditoría | — |

**`ReservasAsientos`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `BIGINT IDENTITY` | No | PK | Identificador | — |
| `IdReserva` | `BIGINT` | No | `FK_ReservasAsientos_Reservas`, `UQ_ReservasAsientos_IdReserva_IdAsiento` | Reserva | Asiento de reserva.reserva |
| `IdAsiento` | `INT` | No | `FK_ReservasAsientos_Asientos` | Asiento | Asiento de reserva.asiento |
| `PrecioTomado` | `DECIMAL(10,2)` | No | CK >= 0 | Precio al apartar (RN10) | Asiento de reserva.precio tomado |
| `FechaRegistro` | `DATETIME2(3)` | No | DF | Auditoría | — |

**`IntentosPago`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `BIGINT IDENTITY` | No | PK | Identificador | Intento.identificador |
| `IdReserva` | `BIGINT` | No | `FK_IntentosPago_Reservas` | Reserva | Intento.reserva |
| `IdResultadoPago` | `TINYINT` | No | `FK_IntentosPago_ResultadosPago` | Resultado | Intento.resultado |
| `FechaIntento` | `DATETIME2(3)` | No | — | `@Ahora` | Intento.fecha |
| `FechaRegistro` | `DATETIME2(3)` | No | DF | Auditoría | — |

**`Ordenes`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `BIGINT IDENTITY` | No | PK | Identificador | Orden.identificador |
| `Folio` | calculada `PERSISTED` | No | `UQ_Ordenes_Folio` | `ORD-000123` (RN19) | Orden.número visible |
| `IdReserva` | `BIGINT` | No | `FK_Ordenes_Reservas`, `UQ_Ordenes_IdReserva` | Reserva pagada | Orden.reserva |
| `IdComprador` | `INT` | No | `FK_Ordenes_Compradores` | Comprador | Orden.comprador |
| `IdSitio` | `INT` | No | `FK_Ordenes_Sitios` | Sitio | Orden.sitio |
| `Total` | `DECIMAL(12,2)` | No | CK >= 0 | Total pagado | Orden.total |
| `FechaCompra` | `DATETIME2(3)` | No | — | `@Ahora` al pagar | Orden.fecha de compra |
| `FechaRegistro` | `DATETIME2(3)` | No | DF | Auditoría | — |

**`Boletos`**

| Columna | Tipo | N | Restricción | Descripción | Contrato |
| --- | --- | --- | --- | --- | --- |
| `Id` | `BIGINT IDENTITY` | No | PK | Identificador | Boleto.identificador |
| `IdOrden` | `BIGINT` | No | `FK_Boletos_Ordenes` | Orden | Boleto.orden |
| `IdFuncion` | `INT` | No | `FK_Boletos_Funciones`, `UQ_Boletos_IdFuncion_IdAsiento` | Función | Boleto.función |
| `IdAsiento` | `INT` | No | `FK_Boletos_Asientos` | Asiento | Boleto.asiento |
| `Precio` | `DECIMAL(10,2)` | No | CK >= 0 | Precio pagado | Boleto.precio |
| `Codigo` | `CHAR(12)` | No | `UQ_Boletos_Codigo` | Código aleatorio (RN20) | Boleto.código único |
| `FechaRegistro` | `DATETIME2(3)` | No | DF | Auditoría | — |

### 6.4 Soporte

**`BitacoraErrores`**: uso interno; no se expone al servicio.

| Columna | Tipo | N | Descripción |
| --- | --- | --- | --- |
| `Id` | `BIGINT IDENTITY` | No | Identificador |
| `Procedimiento` | `NVARCHAR(128)` | Sí | `ERROR_PROCEDURE()` |
| `NumeroError` | `INT` | No | `ERROR_NUMBER()` |
| `Severidad` | `INT` | Sí | `ERROR_SEVERITY()` |
| `Estado` | `INT` | Sí | `ERROR_STATE()` |
| `Linea` | `INT` | Sí | `ERROR_LINE()` |
| `Mensaje` | `NVARCHAR(4000)` | No | `ERROR_MESSAGE()` |
| `FechaRegistro` | `DATETIME2(3)` | No | DF `SYSUTCDATETIME()` |

### 6.5 Parámetros con tipo especial

| Parámetro | Tipo | Justificación |
| --- | --- | --- |
| `@IdsAsientos` (SP07) | `NVARCHAR(MAX)` | Arreglo JSON leído con `OPENJSON` (Propuesta §4). Se valida con `ISJSON` y con un máximo de 10 elementos (RN03). Es la única excepción a la regla de `sqlserver-dba` de no usar `NVARCHAR(MAX)` sin necesidad. |
| `@Ahora`, `@ExpiraEn` | `DATETIME2(3)` | Hora UTC que envía el servicio (E7 y E15) |

## 7. Datos iniciales definidos (`05_datos_iniciales.sql`)

| Tabla | Filas | Contenido |
| --- | --- | --- |
| `Sitios` | 1 | `web_1`, «Teatro Aquí nadie actúa normal» |
| `EstadosReserva` | 3 | Activa, Liberada, Pagada |
| `ResultadosPago` | 2 | Aprobado, Rechazado |
| `Eventos` | 1 | «¡Que no se entere la suegra!» |
| `Zonas` | 3 | Preferente, General, Balcón |
| `Asientos` | 120 | Preferente filas A–C, General D–I y Balcón J–L, con 10 asientos por fila (30 + 60 + 30) |
| `Funciones` | 120 | 40 días (jueves, viernes y sábados del 1 oct al 31 dic 2026: 15 en oct, 12 en nov y 13 en dic) × 3 horarios |
| `PreciosZonaFuncion` | 360 | Preferente $800, General $500 y Balcón $300 MXN en cada función |
| `AsientosFuncion` | 14,400 | 120 funciones × 120 asientos, todos disponibles |

Horarios (E18, UTC−6 fijo):

| Hora local (CDMX) | Hora UTC guardada |
| --- | --- |
| 15:00 | 21:00 del mismo día |
| 19:00 | 01:00 del día siguiente |
| 21:00 | 03:00 del día siguiente |

El script se puede volver a ejecutar sin duplicar datos: antes de insertar verifica si cada fila ya existe por su clave única.

## 8. Preguntas abiertas para otros equipos

Se comunican en el chat del grupo (`BCK_PLAN_TRABAJO.md` §4).

| # | Pregunta | Para | Impacto |
| --- | --- | --- | --- |
| QB1 | ¿Hay funciones canceladas en fechas especiales (24, 25 y 31 dic)? Por ahora se cargan activas (E17). | web_1 | Datos iniciales |
| QB2 | `spReservas_Crear` recibirá `@Ahora` **y `@ExpiraEn`** (E15). ¿Están de acuerdo? | servicio | Firma de SP07 |
| QB3 | ¿Su driver (`mssql`) lee el conjunto de resultados que llega antes del `THROW 51001`, o sólo el mensaje? (riesgo R1 de la Propuesta) | servicio | Forma de informar los asientos que fallaron |
| QB4 | ¿Les sirve el folio `ORD-000123` y el código de boleto de 12 caracteres para el QR? (E16) | servicio, web_1 | Formato de `Folio` y `Codigo` |
| QB5 | Errores nuevos: 53004 (vencimiento inválido) y 54005 (sitio o evento no encontrado). | servicio | Conversión de errores a HTTP |

Mensaje propuesto para el chat:

> **Backend → Servicio y web_1 (Definición):**
> QB1 (web_1): ¿hay funciones canceladas el 24, 25 o 31 de dic? Por ahora las cargamos activas.
> QB2 (servicio): `spReservas_Crear` recibirá `@Ahora` y `@ExpiraEn`; la regla de 5 min sigue en su lado. ¿Ok?
> QB3 (servicio): ¿su driver `mssql` puede leer el SELECT que llega antes del `THROW 51001`? Si no, usen los Id del mensaje.
> QB4: folio de orden `ORD-000123` y código de boleto de 12 caracteres para el QR. ¿Ok?
> QB5: agregamos los errores 53004 (vencimiento inválido, 422) y 54005 (sitio o evento no encontrado, 404).
> Detalle en `citas_backend/docs/BCK_DEFINICION.md`.

## 9. Trazabilidad con el contrato de datos

| Punto del contrato | Dónde se define |
| --- | --- |
| Entidades y campos | §6 (columna «Contrato» de cada tabla) |
| Garantía 1: apartado atómico | RF-B07, RN08, RNF-B03, ADR-002 |
| Garantía 2: pago atómico | RF-B13, RN13–RN15, RNF-B04 |
| Garantía 3: la hora la manda el servicio | RN23, RNF-B05, E15, ADR-003 |
| Garantía 4: unicidad | `UQ_Boletos_IdFuncion_IdAsiento`, `UQ_Boletos_Codigo`, `UQ_Compradores_Correo` (RN18, RN20 y RN21) |
| Garantía 5: persistencia | RNF-B06 |
| Operaciones (`AsientosRepo`, `ReservasRepo` y `OrdenesRepo`) | RF-B03 a RF-B16 |
| Barrido opcional | RF-B17 |
| Volumen y consultas frecuentes | RNF-B08 e índices de la Propuesta §3.6 |
| Datos iniciales | §7 y RF-B18 |
| «Vencida» no se guarda | RN02 |

## 10. Arquitectura

| Archivo | Contenido |
| --- | --- |
| `docs/architecture/BCK_DIAGRAMA_ER.md` | Diagrama entidad-relación (Mermaid) |
| `docs/architecture/adr/BCK_ADR-001-sqlserver-procedimientos.md` | SQL Server con procedimientos almacenados como única interfaz |
| `docs/architecture/adr/BCK_ADR-002-concurrencia-asientosfuncion.md` | Concurrencia con `AsientosFuncion` y actualización condicionada |
| `docs/architecture/adr/BCK_ADR-003-hora-de-negocio-utc.md` | `@Ahora`, `@ExpiraEn` y fechas en UTC |
| `docs/architecture/adr/BCK_ADR-004-errores-throw-por-rangos.md` | Códigos de error por rangos y bitácora |

## 11. Siguiente etapa

Cuando el usuario apruebe esta Definición se pasará a **4. Especificación** (`BCK_ESPECIFICACION.md`): firmas exactas de SP01–SP17, conjuntos de resultados, lista final de errores e índices, con aprobación de cada SP. Responsables: H, A y S.
