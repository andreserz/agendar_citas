# BCK — Especificación: esquema final, procedimientos almacenados, errores, índices y datos iniciales

| Campo | Valor |
| --- | --- |
| Proyecto | `citas_backend`: base de datos para reservar y comprar boletos |
| Etapa | 4. Especificación |
| Estado | **Aprobado** por la usuaria el 6 nov 2026 (los 19 SP y el documento completo) |
| Fecha | 6 de noviembre de 2026 |
| Responsables | H (firmas de los SP y errores), A (esquema, índices y datos iniciales), S (aprobación de cada SP). Ver `BCK_PLAN_TRABAJO.md` |
| Fuentes | `BCK_DEFINICION.md` (aprobada), `BCK_RESPUESTAS_P15_P19.md` (aprobada), `BCK_PROPUESTA.md`, ADR-001 a ADR-004, `citas_service/docs/specs/contrato-datos-backend.md`, `citas_service/docs/specs/ACUERDOS.md` (D1–D14), `citas_service/app/repos/interfaces.js`, `citas_service/docs/specs/openapi.yaml` |
| Siguiente etapa | 5. Construcción: `app/01_crear_bd.sql` a `app/05_datos_iniciales.sql`, con el subagente `sqlserver-dba` |

---

## 1. Qué fija este documento

La Definición dice **qué** hace la base de datos. Este documento dice **cómo** lo hace, con el detalle suficiente para escribir los scripts sin tomar más decisiones:

1. El esquema final: lo que cambia respecto al diccionario de `BCK_DEFINICION.md` §6 (§3).
2. Los índices definitivos (§4).
3. La plantilla común de los procedimientos (§5).
4. La firma, las validaciones en orden, los conjuntos de resultados y los errores de **SP01–SP19** (§6).
5. La lista final de códigos `THROW` (§7).
6. El algoritmo de los datos iniciales de web_1 y web_2 (§8).
7. Los scripts, su orden y la seguridad (§9).

## 2. Cambios respecto a la Definición

### 2.1 Cambios aprobados en `BCK_RESPUESTAS_P15_P19.md` (6 nov 2026)

| Origen | Cambio |
| --- | --- |
| P15 | `Reservas.IdComprador` y `Ordenes.IdComprador` admiten nulos. Columna nueva `Sitios.RequiereComprador`. Reglas RN06 y RN09 ajustadas y reglas nuevas RN28 y RN29. Error 53005. |
| P16 | Columnas nuevas `Funciones.IdZona`, `Formato` e `Idioma`, y `Eventos.Clasificacion` y `DuracionMin`. La restricción única de `Funciones` incluye `IdZona`. Regla RN30. |
| P17 | SP18 `spOrdenes_ObtenerPorCodigo`. web_2 pide folio y código, y el servicio compara el folio (§11 del documento). |
| P18 | SP19 `spReservas_ContarPorDia` e índice `IX_Reservas_IdSitio_CreadaEn`. Error 53007. |
| P19 | Columna nueva `IntentosPago.UltimosDigitos`, que reciben SP12 y SP13. Regla RN31. Error 53006. |

### 2.2 Ajustes nuevos al alinear con las interfaces del servicio

Revisé `citas_service/app/repos/interfaces.js` (esqueleto del PR #11) contra SP01–SP17. Estas diferencias se resuelven aquí y **se deben avisar al servicio** (§11):

| # | Hallazgo | Ajuste en esta Especificación |
| --- | --- | --- |
| H1 | El servicio distingue `RESERVA_PAGADA` (`409`) de `RESERVA_LIBERADA` (`410`). Nuestro 51003 cubría los dos casos. | 51003 queda sólo para «ya pagada». **Error nuevo 52002, «La reserva fue liberada»**, en el rango 52xxx (`410`). |
| H2 | `AsientosRepo.obtenerEvento(eventoId)` no tenía SP. | SP03 recibe `@IdEvento` opcional y, si se envía, devuelve sólo ese evento. No se agrega un SP nuevo. |
| H3 | `AsientosRepo.listarZonas(funcionId)` (zonas con su precio en la función) no tenía SP. | SP06 devuelve **dos conjuntos de resultados**: primero las zonas con su precio y después los asientos. |
| H4 | `ReservasRepo.registrarPagoRechazado` debe rechazar reservas vencidas, pagadas o liberadas. | SP12 valida lo mismo que SP13 (52001, 51003 y 52002). |
| H5 | `Reserva` y `Orden` llevan `moneda` y `ordenId`, y `Boleto` lleva `eventoNombre`, `inicio` y `zonaId`. | SP08 devuelve `Moneda` e `IdOrden`. SP14 devuelve los datos completos del boleto. Regla nueva RN32: todos los precios de una función tienen la misma moneda. |
| H6 | `openapi.yaml` tiene `Funcion.asientosDisponibles` y `Evento.recinto`. | SP04 y SP05 reciben `@Ahora` y devuelven `AsientosDisponibles`. SP03 devuelve `Recinto` (`Sitios.Descripcion`). |
| H7 | El sitio llega en cada petición como clave (`X-Sitio: web_1`). | Los SP que necesitan el sitio reciben `@ClaveSitio VARCHAR(20)`, así el servicio no tiene que buscar el `Id`. |

### 2.3 Error nuevo para el registro de compradores

| Hallazgo | Ajuste |
| --- | --- |
| SP01 no tenía un error para datos vacíos; una columna `NOT NULL` vacía terminaría como `50000`. | **Error nuevo 53008, «Datos del comprador incompletos»** (`422`). |

## 3. Esquema final

Todo lo que no aparece aquí queda **igual** al diccionario de `BCK_DEFINICION.md` §6.

### 3.1 Columnas nuevas o modificadas

| Tabla | Columna | Tipo | N | Restricción | Origen |
| --- | --- | --- | --- | --- | --- |
| `Sitios` | `RequiereComprador` | `BIT` | No | `DF_Sitios_RequiereComprador` = 1 | P15 |
| `Eventos` | `Clasificacion` | `VARCHAR(5)` | Sí | — | P16 |
| `Eventos` | `DuracionMin` | `SMALLINT` | Sí | `CK_Eventos_DuracionMin` (> 0) | P16 |
| `Funciones` | `IdZona` | `INT` | Sí | `FK_Funciones_Zonas` | P16 (sala) |
| `Funciones` | `Formato` | `VARCHAR(2)` | Sí | `CK_Funciones_Formato` (`IN ('2D','3D')`) | P16 |
| `Funciones` | `Idioma` | `NVARCHAR(30)` | Sí | — | P16 |
| `Reservas` | `IdComprador` | `INT` | **Sí** (antes No) | `FK_Reservas_Compradores` | P15 |
| `Ordenes` | `IdComprador` | `INT` | **Sí** (antes No) | `FK_Ordenes_Compradores` | P15 |
| `IntentosPago` | `UltimosDigitos` | `CHAR(4)` | No | `CK_IntentosPago_UltimosDigitos` (`NOT LIKE '%[^0-9]%'`) | P19 |

### 3.2 Restricciones que cambian

| Antes | Después | Motivo |
| --- | --- | --- |
| `UQ_Funciones_IdEvento_FechaHoraInicio` | `UQ_Funciones_IdEvento_FechaHoraInicio_IdZona` | P16. SQL Server trata los `NULL` como iguales en un `UNIQUE`, así que web_1 (`IdZona` nula) conserva la misma protección. |

### 3.3 Columnas calculadas

| Tabla | Columna | Expresión | Nota |
| --- | --- | --- | --- |
| `Asientos` | `Etiqueta` | `Fila + CAST(Numero AS VARCHAR(5))` `PERSISTED` | `A7`, `L10` |
| `Ordenes` | `Folio` | `'ORD-' + CASE WHEN Id <= 999999 THEN RIGHT('000000' + CAST(Id AS VARCHAR(20)), 6) ELSE CAST(Id AS VARCHAR(20)) END` `PERSISTED` | RN19. Es determinista, así que puede llevar `UQ_Ordenes_Folio`. |

### 3.4 Reglas nuevas

| # | Regla | Error |
| --- | --- | --- |
| RN28 | Si el sitio tiene `RequiereComprador = 1`, SP07 exige `@IdComprador`. | 53005 |
| RN29 | SP13 copia `IdComprador` de la reserva a la orden, aunque sea nulo. | — |
| RN30 | Si `Funciones.IdZona` no es nula, sus precios y sus asientos son de esa zona. Lo garantizan los datos iniciales. | — |
| RN31 | La BD sólo recibe los últimos 4 dígitos de la tarjeta; nunca el número completo ni el CVV. | 53006 |
| RN32 | Todos los precios de una función tienen la misma moneda. Lo garantizan los datos iniciales; los SP leen la moneda del precio de la función. | — |
| RN33 | Una reserva `Liberada` no acepta pagos ni intentos y no se puede volver a liberar (H1). | 52002 |

## 4. Índices definitivos (`03_indices.sql`)

Las restricciones `PK_` y `UQ_` crean su propio índice en `02_tablas.sql`. Aquí sólo van los índices adicionales y la forma exacta de dos `UQ` que necesitan `INCLUDE`.

| Índice | Tabla (columnas) | INCLUDE / filtro | Lo usan |
| --- | --- | --- | --- |
| `UQ_AsientosFuncion_IdFuncion_IdAsiento` | `AsientosFuncion (IdFuncion, IdAsiento)`, **índice único** | INCLUDE (`Vendido`, `ExpiraEn`, `IdReservaActual`) | SP04–SP07, SP13 |
| `IX_AsientosFuncion_IdReservaActual` | `AsientosFuncion (IdReservaActual)` | `WHERE IdReservaActual IS NOT NULL` | SP11, SP13, SP17 |
| `IX_Reservas_IdComprador_IdFuncion_IdEstadoReserva` | `Reservas (IdComprador, IdFuncion, IdEstadoReserva)` | INCLUDE (`ExpiraEn`) | SP07, SP09, SP10 |
| `IX_Reservas_IdEstadoReserva_ExpiraEn` | `Reservas (IdEstadoReserva, ExpiraEn)` | — | SP17 |
| `IX_Reservas_IdSitio_CreadaEn` | `Reservas (IdSitio, CreadaEn)` | INCLUDE (`IdEstadoReserva`) | SP19 (P18) |
| `IX_IntentosPago_IdReserva` | `IntentosPago (IdReserva)` | INCLUDE (`IdResultadoPago`, `UltimosDigitos`) | SP14, SP18 |
| `IX_Ordenes_IdComprador` | `Ordenes (IdComprador)` | INCLUDE (`FechaCompra`, `Total`) | SP15 |
| `IX_Boletos_IdOrden` | `Boletos (IdOrden)` | — | SP13–SP16, SP18 |

**Cambio respecto a la Propuesta:** se elimina `IX_Funciones_Evento (IdEvento, FechaHoraInicio)`, porque `UQ_Funciones_IdEvento_FechaHoraInicio_IdZona` empieza con esas mismas columnas y ya sirve para SP04. `UQ_Boletos_IdFuncion_IdAsiento` sirve para contar comprados (SP10) y `UQ_Boletos_Codigo`, para SP18.

## 5. Plantilla común de los procedimientos

### 5.1 Reglas

| # | Regla |
| --- | --- |
| C1 | Esquema `dbo`. Nombre `sp<Tabla>_<Acción>`. `CREATE OR ALTER PROCEDURE` (SQL Server 2016 SP1+, compatible con 2019). |
| C2 | `SET NOCOUNT ON; SET XACT_ABORT ON;` al inicio de todos. |
| C3 | Todo el cuerpo va dentro de `BEGIN TRY … END TRY BEGIN CATCH … END CATCH` (ADR-004), incluso los de consulta, para que todos registren y oculten los errores no previstos igual. |
| C4 | Las validaciones de negocio se lanzan con `THROW <código>, N'<mensaje>', 1;`. Si el mensaje lleva datos, se arma antes en `@Mensaje NVARCHAR(2048)`. |
| C5 | Los que modifican más de una tabla (SP07, SP11, SP13 y SP17) usan `BEGIN TRANSACTION … COMMIT`. SP12 también la usa porque bloquea la reserva. |
| C6 | Parámetros de tiempo: `@Ahora DATETIME2(3)` y `@ExpiraEn DATETIME2(3)`, en UTC (ADR-003). Ningún SP usa `SYSUTCDATETIME()` para decidir vencimientos. |
| C7 | Sitio: `@ClaveSitio VARCHAR(20)` (H7). Si no existe o está inactivo: 54005. |
| C8 | Lista de asientos: `@IdsAsientos NVARCHAR(MAX)` con un arreglo JSON de enteros, por ejemplo `[12,15,18]` (Definición §6.5). |
| C9 | Las columnas de los resultados están en PascalCase y sus nombres son estables: el servicio las lee por nombre. Los estados se devuelven como texto (`Disponible`, `Apartado`, `Vendido`, `Activa`, `Liberada`, `Pagada`, `Aprobado`, `Rechazado`). |
| C10 | Ningún resultado de catálogo revela quién apartó o compró un asiento (`interfaces.js`, `listarAsientos`). |
| C11 | Los SP de consulta leen con el nivel de aislamiento por omisión (`READ COMMITTED`). No se usa `NOLOCK`. |

### 5.2 Bloque `CATCH` común

```sql
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

    -- Errores de negocio (51000–54999): se vuelven a lanzar tal cual.
    IF ERROR_NUMBER() BETWEEN 51000 AND 54999
        THROW;

    -- Correo duplicado por carrera entre dos registros (SP01): 2627/2601 → 51002.
    -- (sólo en SP01; ver §6.1)

    -- Error no previsto: se registra y se oculta.
    INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
    VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());

    THROW 50000, N'Error interno', 1;
END CATCH
```

### 5.3 Formas comunes de los resultados

Para que el servicio use un solo mapeador, varios SP devuelven la misma forma.

**Forma R (reserva)**, la usan SP07, SP08, SP09 y SP11:

| Conjunto | Columnas |
| --- | --- |
| R1 encabezado | `IdReserva BIGINT`, `ClaveSitio`, `IdComprador INT NULL`, `IdFuncion`, `Estado` (`Activa`/`Liberada`/`Pagada`), `Vencida BIT`, `CreadaEn`, `ExpiraEn`, `Total DECIMAL(12,2)`, `Moneda CHAR(3)`, `IdOrden BIGINT NULL` |
| R2 asientos | `IdReserva`, `IdAsiento`, `Etiqueta`, `IdZona`, `PrecioTomado DECIMAL(10,2)` |

`Vencida = 1` sólo si `Estado = 'Activa'` y `ExpiraEn <= @Ahora` (RN02). El servicio lo traduce al estado `vencida` de su API.

**Forma O (orden)**, la usan SP13, SP14, SP15 y SP18:

| Conjunto | Columnas |
| --- | --- |
| O1 orden | `IdOrden BIGINT`, `Folio`, `IdReserva`, `ClaveSitio`, `IdComprador INT NULL`, `FechaCompra`, `Total`, `Moneda`, `UltimosDigitos CHAR(4)` (del intento aprobado) |
| O2 boletos | `IdOrden`, `IdBoleto`, `Codigo CHAR(12)`, `IdEvento`, `NombreEvento`, `IdFuncion`, `FechaHoraInicio`, `IdZona`, `Zona`, `IdAsiento`, `Etiqueta`, `Precio` |

## 6. Procedimientos almacenados

Prioridad de construcción (plan de trabajo §3): **P1** = SP06, SP07 y SP13; **P2** = los demás que usa el flujo de compra; **P3** = SP16 y SP17, que pueden quedar después de la entrega.

### 6.1 SP01 `spCompradores_Registrar` — RF-B01 · P2

| Parámetro | Tipo |
| --- | --- |
| `@Nombre` | `NVARCHAR(150)` |
| `@Correo` | `NVARCHAR(254)`, ya en minúsculas y sin espacios (RN21) |
| `@HashContrasena` | `VARCHAR(255)` (RN22) |

Validaciones en orden:
1. Algún parámetro nulo o vacío después de `TRIM` → **53008**.
2. El correo ya existe → **51002**.
3. `INSERT`. Si dos registros simultáneos chocan con `UQ_Compradores_Correo` (errores 2627 o 2601), el `CATCH` de este SP lanza **51002** en lugar de 50000.

Resultado: una fila con `IdComprador`, `Nombre` y `Correo`. **Nunca** devuelve el hash.

### 6.2 SP02 `spCompradores_ObtenerPorCorreo` — RF-B02 · P2

| Parámetro | Tipo |
| --- | --- |
| `@Correo` | `NVARCHAR(254)` |

Resultado: `IdComprador`, `Nombre`, `Correo` y `HashContrasena` del comprador activo, o **ningún renglón** si no existe. No lanza error, para que el servicio responda «credenciales incorrectas» sin revelar si el correo existe.

### 6.3 SP03 `spEventos_Listar` — RF-B03 · P2

| Parámetro | Tipo |
| --- | --- |
| `@ClaveSitio` | `VARCHAR(20) = NULL` (nulo = todos los sitios) |
| `@IdEvento` | `INT = NULL` (H2: si se envía, sólo ese evento) |

Validaciones: si `@ClaveSitio` no existe → **54005**. Si `@IdEvento` no existe, está inactivo o es de otro sitio → **54005**.

Resultado, eventos activos ordenados por `Nombre`: `IdEvento`, `ClaveSitio`, `Nombre`, `Descripcion`, `Recinto` (`Sitios.Descripcion`), `Clasificacion`, `DuracionMin`.

### 6.4 SP04 `spFunciones_ListarPorEvento` — RF-B04 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdEvento` | `INT` |
| `@Ahora` | `DATETIME2(3)` (H6) |

Validación: evento inexistente o inactivo → **54005**.

Resultado, funciones activas ordenadas por `FechaHoraInicio` y `Sala`: `IdFuncion`, `IdEvento`, `FechaHoraInicio` (UTC), `Formato`, `Idioma`, `IdZona`, `Sala` (`Zonas.Descripcion`), `Capacidad` (asientos activos de la sala) y `AsientosDisponibles` (asientos de la función con estado `Disponible` a `@Ahora`, RN01). `IdZona`, `Sala` y `Capacidad` son nulos en web_1.

### 6.5 SP05 `spFunciones_Obtener` — RF-B05 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdFuncion` | `INT` |
| `@Ahora` | `DATETIME2(3)` |

Validación: función inexistente o inactiva → **54001**.

Resultado: las columnas de SP04 más `ClaveSitio`, `NombreEvento`, `Clasificacion` y `DuracionMin`.

### 6.6 SP06 `spAsientos_ListarPorFuncion` — RF-B06 · **P1**

| Parámetro | Tipo |
| --- | --- |
| `@IdFuncion` | `INT` |
| `@Ahora` | `DATETIME2(3)` |

Validación: función inexistente o inactiva → **54001**.

Resultados (H3):

| Conjunto | Columnas | Orden |
| --- | --- | --- |
| 1. Zonas | `IdZona`, `Zona`, `Precio`, `Moneda` (de `PreciosZonaFuncion`) | `Precio` descendente |
| 2. Asientos | `IdAsiento`, `IdZona`, `Fila`, `Numero`, `Etiqueta`, `Precio`, `Estado`, `ExpiraEn` | `Fila`, `Numero` |

`Estado` se calcula con RN01: `Vendido` si `Vendido = 1`; `Apartado` si `IdReservaActual IS NOT NULL AND ExpiraEn > @Ahora`; si no, `Disponible`. `ExpiraEn` sólo se devuelve cuando el estado es `Apartado`; en los demás casos va nulo. No se devuelve `IdReservaActual` (C10).

### 6.7 SP07 `spReservas_Crear` — RF-B07 · **P1**

| Parámetro | Tipo |
| --- | --- |
| `@ClaveSitio` | `VARCHAR(20)` |
| `@IdComprador` | `INT = NULL` (P15) |
| `@IdFuncion` | `INT` |
| `@IdsAsientos` | `NVARCHAR(MAX)`, arreglo JSON |
| `@Ahora` | `DATETIME2(3)` |
| `@ExpiraEn` | `DATETIME2(3)` |

Validaciones antes de la transacción, en este orden:

| # | Validación | Error |
| --- | --- | --- |
| 1 | `@ExpiraEn > @Ahora` (RN07) | 53004 |
| 2 | El sitio existe y está activo | 54005 |
| 3 | Si el sitio tiene `RequiereComprador = 1`, `@IdComprador` no es nulo (RN28) | 53005 |
| 4 | Si `@IdComprador` no es nulo, existe y está activo (RN06) | 54004 |
| 5 | La función existe, está activa y su evento es del sitio (RN05) | 54001 |
| 6 | `ISJSON(@IdsAsientos) = 1`, entre 1 y 10 elementos, todos enteros y sin repetidos (RN03). Se cargan en `@Solicitados TABLE (IdAsiento INT PRIMARY KEY)`. | 53002 |
| 7 | Cada asiento tiene fila en `AsientosFuncion` para la función y está activo en `Asientos` (RN04, RN26) | 53003 |

Transacción (ADR-002):

1. `BEGIN TRANSACTION`.
2. **Límite de 10 (RN09), sólo si hay comprador.** Primero bloquea al comprador con `SELECT … FROM Compradores WITH (UPDLOCK, HOLDLOCK) WHERE Id = @IdComprador`, para que dos reservas simultáneas del mismo comprador se validen una después de la otra. Después suma los asientos de sus reservas `Activa` con `ExpiraEn > @Ahora` en la función, más sus boletos de la función, más los solicitados. Si pasa de 10 → **53001**.
3. Calcula `@Total` con `PreciosZonaFuncion` (RN10) y lee `@Moneda` (RN32).
4. `INSERT INTO Reservas` (`CreadaEn = @Ahora`, `ExpiraEn = @ExpiraEn`, estado `Activa`, RN11) y toma `@IdReserva = SCOPE_IDENTITY()`.
5. Actualización condicionada:
   ```sql
   UPDATE af SET IdReservaActual = @IdReserva, ExpiraEn = @ExpiraEn
     FROM dbo.AsientosFuncion af
     JOIN @Solicitados s ON s.IdAsiento = af.IdAsiento
    WHERE af.IdFuncion = @IdFuncion
      AND af.Vendido = 0
      AND (af.IdReservaActual IS NULL OR af.ExpiraEn <= @Ahora);
   ```
6. Si `@@ROWCOUNT` es menor que el número de solicitados (RN08):
   - Guarda los asientos que fallaron en una **variable de tabla** `@Fallidos (IdAsiento, Etiqueta, Motivo)`, con `Motivo` = `Vendido` o `Apartado`. Las variables de tabla conservan sus datos después de un `ROLLBACK`.
   - `ROLLBACK TRANSACTION`.
   - Devuelve `@Fallidos` como conjunto de resultados, ordenado por `IdAsiento`.
   - Arma el mensaje con `STRING_AGG(IdAsiento, ',') WITHIN GROUP (ORDER BY IdAsiento)`: **`Asientos no disponibles: 12,15,18`** (Id separados por comas y sin espacios, formato confirmado con el servicio en QB3).
   - Lanza **51001** con ese mensaje.
7. `INSERT INTO ReservasAsientos` con `PrecioTomado` (RN10).
8. `COMMIT`.

Resultado si todo sale bien: **forma R** (§5.3) de la reserva creada.

### 6.8 SP08 `spReservas_Obtener` — RF-B08 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdReserva` | `BIGINT` |
| `@Ahora` | `DATETIME2(3)` |

Validación: la reserva no existe → **54002**. Resultado: **forma R**. El servicio comprueba con `IdComprador` que la reserva sea del comprador que pregunta (RN09 del servicio).

### 6.9 SP09 `spReservas_ListarActivasPorComprador` — RF-B09 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdComprador` | `INT` |
| `@Ahora` | `DATETIME2(3)` |

Resultado: **forma R** con todas las reservas `Activa` del comprador con `ExpiraEn > @Ahora`, ordenadas por `CreadaEn`. Si no tiene ninguna, los conjuntos de resultados salen vacíos; no es un error.

### 6.10 SP10 `spReservas_ContarAsientosCompradorFuncion` — RF-B10 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdComprador` | `INT` |
| `@IdFuncion` | `INT` |
| `@Ahora` | `DATETIME2(3)` |

Resultado: una fila con `Apartados` (asientos en reservas `Activa` con `ExpiraEn > @Ahora`), `Comprados` (boletos de órdenes del comprador en la función) y `Total`. Es la misma suma que SP07 usa para RN09.

### 6.11 SP11 `spReservas_Liberar` — RF-B11 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdReserva` | `BIGINT` |

Transacción:
1. Lee la reserva con `UPDLOCK`. Si no existe → **54002**; si está `Pagada` → **51003**; si está `Liberada` → **52002** (H1).
2. Cambia la reserva a `Liberada`.
3. En `AsientosFuncion`, pone `IdReservaActual` y `ExpiraEn` en nulo donde `IdReservaActual = @IdReserva AND Vendido = 0` (RN12).
4. `COMMIT`.

No recibe `@Ahora`: el servicio responde `410` sin llamar al SP cuando la reserva ya venció (Anexo A.4 #3 del servicio).

Resultado: **forma R** con `Estado = 'Liberada'` y `Vencida = 0`.

### 6.12 SP12 `spIntentosPago_Registrar` — RF-B12 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdReserva` | `BIGINT` |
| `@UltimosDigitos` | `CHAR(4)` (P19) |
| `@Ahora` | `DATETIME2(3)` |

Registra un intento **rechazado**. Transacción corta, para no chocar con un SP13 simultáneo:

| # | Validación | Error |
| --- | --- | --- |
| 1 | `@UltimosDigitos` son 4 dígitos (RN31) | 53006 |
| 2 | La reserva existe (se lee con `UPDLOCK`) | 54002 |
| 3 | No está `Pagada` | 51003 |
| 4 | No está `Liberada` | 52002 |
| 5 | `ExpiraEn > @Ahora` (RN16) | 52001 |

Luego inserta en `IntentosPago` con `Rechazado` y `FechaIntento = @Ahora`. La reserva y su `ExpiraEn` no cambian.

Resultado: `IdIntento`, `IdReserva`, `Resultado` (`Rechazado`), `FechaIntento` y `UltimosDigitos`.

### 6.13 SP13 `spOrdenes_Pagar` — RF-B13 · **P1**

| Parámetro | Tipo |
| --- | --- |
| `@IdReserva` | `BIGINT` |
| `@UltimosDigitos` | `CHAR(4)` (P19) |
| `@Ahora` | `DATETIME2(3)` |

Validaciones 1 a 5 iguales a SP12, con la reserva bloqueada con `UPDLOCK` **dentro** de la transacción. Después, en la misma transacción (garantía 2, RN15):

1. Comprobación defensiva: todas las filas de la reserva en `AsientosFuncion` siguen con `IdReservaActual = @IdReserva` y `Vendido = 0`. Si no → **51001**.
2. `INSERT INTO IntentosPago` con `Aprobado`, `@Ahora` y `@UltimosDigitos`.
3. `INSERT INTO Ordenes` (`IdReserva`, `IdComprador` de la reserva aunque sea nulo, `IdSitio`, `Total`, `FechaCompra = @Ahora`, RN29). El `Folio` se calcula solo (§3.3).
4. Un boleto por asiento de `ReservasAsientos`, con `Precio = PrecioTomado` y un `Codigo` nuevo (RN20):
   - Alfabeto de 32 símbolos sin `0`, `O`, `1` ni `I`: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`.
   - Se toman 12 bytes de `CRYPT_GEN_RANDOM(12)` y cada uno se convierte con `SUBSTRING(@Alfabeto, (byte % 32) + 1, 1)`. Como 256 es múltiplo de 32, todos los símbolos tienen la misma probabilidad.
   - Si el código ya existe en `Boletos`, se genera otro, hasta 5 intentos. Si los 5 chocan (algo prácticamente imposible), se lanza un error interno (50000).
   - Se inserta boleto por boleto en un ciclo de máximo 10 vueltas. `UQ_Boletos_IdFuncion_IdAsiento` es la segunda defensa (RN18); si salta, el `CATCH` lanza 51001.
5. La reserva pasa a `Pagada`.
6. En `AsientosFuncion` de la reserva: `Vendido = 1` y `ExpiraEn = NULL`. `IdReservaActual` se conserva, porque identifica la reserva que compró el asiento.
7. `COMMIT`.

Resultados: primero el intento (mismas columnas que SP12, con `Aprobado`) y después la **forma O** de la orden nueva.

### 6.14 SP14 `spOrdenes_Obtener` — RF-B14 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdOrden` | `BIGINT` |

Validación: la orden no existe → **54003**. Resultado: **forma O**.

### 6.15 SP15 `spOrdenes_ListarPorComprador` — RF-B15 · P2

| Parámetro | Tipo |
| --- | --- |
| `@IdComprador` | `INT` |

Resultado: **forma O** con todas las órdenes del comprador, de la más antigua a la más reciente (`interfaces.js`). Si no tiene órdenes, los conjuntos de resultados salen vacíos.

### 6.16 SP16 `spBoletos_Consolidar` — RF-B16 · P3

| Parámetro | Tipo |
| --- | --- |
| `@ClaveSitio` | `VARCHAR(20) = NULL` (nulo = todos) |

Validación: `@ClaveSitio` no nulo e inexistente → **54005**.

Resultado: las columnas de O2 más `Folio`, `ClaveSitio`, `IdComprador` y `NombreComprador`, que son nulos en compras de invitado (`LEFT JOIN`, P15), y `FechaCompra`. Ordenado por `FechaCompra` y `IdBoleto`. No devuelve correos ni hashes.

### 6.17 SP17 `spReservas_LimpiarVencidas` (opcional) — RF-B17 · P3

| Parámetro | Tipo |
| --- | --- |
| `@Ahora` | `DATETIME2(3)` |

En una transacción, marca como `Liberada` las reservas `Activa` con `ExpiraEn <= @Ahora` y limpia sus filas de `AsientosFuncion` que tengan `Vendido = 0`. Resultado: una fila con `ReservasLiberadas`. No cambia ninguna regla, porque una reserva vencida ya se considera libre (RN02).

### 6.18 SP18 `spOrdenes_ObtenerPorCodigo` — P17 · P2

| Parámetro | Tipo |
| --- | --- |
| `@ClaveSitio` | `VARCHAR(20)` |
| `@Codigo` | `CHAR(12)` |

Validaciones: sitio inexistente → **54005**. El código no existe **o su orden es de otro sitio** → **54003**: se responde lo mismo en los dos casos, para no revelar que el código existe en otro sitio.

Resultado: **forma O** de la orden completa (todos sus boletos, no sólo el del código). El servicio compara `Folio` con el que escribió el comprador y, si no coincide, responde `404` (`BCK_RESPUESTAS_P15_P19.md` §11).

### 6.19 SP19 `spReservas_ContarPorDia` — P18 · P2

| Parámetro | Tipo |
| --- | --- |
| `@ClaveSitio` | `VARCHAR(20)` |
| `@Desde` | `DATE`, día local de la Ciudad de México |
| `@Hasta` | `DATE`, día local, incluido |

Validaciones: sitio inexistente → **54005**. Algún parámetro de fecha nulo, `@Desde > @Hasta` o rango de más de 366 días → **53007**.

Cálculo: el rango UTC es de `DATEADD(HOUR, 6, CAST(@Desde AS DATETIME2(3)))` (incluido) a `DATEADD(HOUR, 6, CAST(DATEADD(DAY, 1, @Hasta) AS DATETIME2(3)))` (excluido), con el UTC−6 fijo de ADR-003. Las reservas se agrupan por `CAST(DATEADD(HOUR, -6, CreadaEn) AS DATE)`.

Resultado, ordenado por `Fecha`: `Fecha` (local), `ReservasCreadas` (todas, sin importar su estado; coincide con RN06 de web_2) y `ReservasPagadas`. Los días sin reservas no aparecen.

## 7. Lista final de errores `THROW`

Sustituye a `BCK_DEFINICION.md` §5.6. La columna «HTTP» es la sugerencia del backend; la conversión final la hace el servicio (D10).

| Código | HTTP | Mensaje | SP | Regla |
| --- | --- | --- | --- | --- |
| 51001 | 409 | `Asientos no disponibles: {Ids}` | SP07, SP13 | RN08, RN18 |
| 51002 | 409 | El correo ya está registrado | SP01 | RN21 |
| 51003 | 409 | La reserva ya está pagada | SP11, SP12, SP13 | RN13, RN17 (**ajustado**, H1) |
| 52001 | 410 | La reserva venció | SP12, SP13 | RN14, RN16 |
| 52002 | 410 | La reserva fue liberada | SP11, SP12, SP13 | RN33 (**nuevo**, H1) |
| 53001 | 422 | Supera el máximo de 10 asientos por persona y función | SP07 | RN09 |
| 53002 | 422 | Lista de asientos vacía, repetida, inválida o de más de 10 | SP07 | RN03 |
| 53003 | 422 | Asiento que no pertenece a la función | SP07 | RN04, RN26 |
| 53004 | 500 (D10) | La fecha de vencimiento debe ser posterior a la hora actual | SP07 | RN07 |
| 53005 | 500 (sugerido) | El sitio requiere un comprador | SP07 | RN28 (P15) |
| 53006 | 500 (sugerido) | Últimos dígitos inválidos | SP12, SP13 | RN31 (P19) |
| 53007 | 422 | Rango de fechas inválido | SP19 | P18 |
| 53008 | 422 | Datos del comprador incompletos | SP01 | (**nuevo**, §2.3) |
| 54001 | 404 | Función no encontrada | SP05–SP07 | RN05 |
| 54002 | 404 | Reserva no encontrada | SP08, SP11–SP13 | — |
| 54003 | 404 | Orden no encontrada | SP14, SP18 | — |
| 54004 | 404 | Comprador no encontrado | SP07 | RN06 |
| 54005 | 404 | Sitio o evento no encontrado | SP03, SP04, SP07, SP16, SP18, SP19 | — |
| 50000 | 500 | Error interno | Todos | RN27 |

## 8. Datos iniciales (`05_datos_iniciales.sql`)

### 8.1 Reglas del script

- **Se puede volver a ejecutar sin duplicar datos:** cada `INSERT` usa `WHERE NOT EXISTS` sobre la clave única de la fila.
- **Todo dentro de una transacción**, con `SET XACT_ABORT ON` y `TRY/CATCH`. Si algo falla no queda una carga a medias.
- **Días de la semana sin depender de `DATEFIRST`:** se calcula `DATEDIFF(DAY, '20000103', Fecha) % 7`, donde el 3 de enero de 2000 fue lunes. 0 = lunes, 3 = jueves, 4 = viernes, 5 = sábado y 6 = domingo.
- **Hora local a UTC:** se suman 6 horas fijas (ADR-003).
- Los días se generan con una tabla de números (CTE recursiva con `OPTION (MAXRECURSION 400)` o `sys.all_objects`), sin ciclos fila por fila.
- Al final hay un bloque de verificación con el número de filas esperado por tabla (§8.4).

### 8.2 Catálogos

| Tabla | Filas |
| --- | --- |
| `EstadosReserva` | 1 Activa, 2 Liberada, 3 Pagada |
| `ResultadosPago` | 1 Aprobado, 2 Rechazado |
| `Sitios` | `web_1` «Teatro Aquí nadie actúa normal», `RequiereComprador = 1`; `web_2` «Cineclub», `RequiereComprador = 0` |

Los Id de `EstadosReserva` y `ResultadosPago` se insertan con `SET IDENTITY_INSERT ON` para que los SP puedan usar 1, 2 y 3 sin buscarlos.

### 8.3 web_1 y web_2

| Dato | web_1 (D7, sin cambios) | web_2 (propuesta del backend, QB6–QB8) |
| --- | --- | --- |
| Evento | «¡Que no se entere la suegra!»; clasificación y duración nulas | «Spider-Man»; clasificación `B`; 120 min |
| Zonas | Preferente, General, Balcón | Sala 1 … Sala 10 |
| Asientos | Preferente A–C, General D–I y Balcón J–L, 10 por fila: **120** | Filas A–H de 10 en cada sala: **800** |
| Días | Jueves, viernes y sábados del 1 oct al 31 dic 2026: **40** | Del lun 9 al dom 15 nov 2026: **7** |
| Horarios locales → UTC | 15:00 → 21:00; 19:00 → 01:00 (+1 día); 21:00 → 03:00 (+1 día) | Salas 1–5 (2D): 13:00 → 19:00; 16:00 → 22:00; 20:00 → 02:00 (+1 día). Salas 6–10 (3D): 12:30 → 18:30; 15:30 → 21:30; 18:30 → 00:30 (+1 día) |
| Funciones | 40 × 3 = **120**, `IdZona`, `Formato` e `Idioma` nulos | 7 × 10 × 3 = **210**, `IdZona` = sala, `Formato` 2D o 3D, `Idioma` «Español» |
| Precios | 120 × 3 = **360**: $800, $500 y $300 MXN | **210**: $100 MXN en 2D y $150 MXN en 3D, sólo para la sala de la función (RN30) |
| `AsientosFuncion` | 120 × 120 = **14,400** | 210 × 80 = **16,800**, sólo los asientos de la sala |

Si web_2 responde QB6–QB8 con otros valores, sólo cambian las constantes al inicio del bloque de web_2: fechas, filas, clasificación, duración e idioma.

### 8.4 Totales esperados (verificación)

| Tabla | Filas |
| --- | --- |
| `Sitios` | 2 |
| `EstadosReserva` | 3 |
| `ResultadosPago` | 2 |
| `Eventos` | 2 |
| `Zonas` | 13 |
| `Asientos` | 920 |
| `Funciones` | 330 |
| `PreciosZonaFuncion` | 570 |
| `AsientosFuncion` | 31,200 |
| `Compradores`, `Reservas`, `ReservasAsientos`, `IntentosPago`, `Ordenes`, `Boletos`, `BitacoraErrores` | 0 |

### 8.5 Funciones nuevas después de la carga (riesgo R2)

No hay un SP para crear funciones, porque ningún sitio lo pidió. Si hace falta agregar funciones, se hace con un script numerado nuevo que siga §8.1 y llene `PreciosZonaFuncion` y `AsientosFuncion` en la misma transacción.

## 9. Scripts, orden y seguridad

| Script | Contenido | Responsable |
| --- | --- | --- |
| `app/01_crear_bd.sql` | Crea la base **`CitasDB`** si no existe, con intercalación `Modern_Spanish_CI_AS` (sin distinción de mayúsculas, RN21) y modelo de recuperación `SIMPLE`. Crea el rol `rolCitasServicio` | A |
| `app/02_tablas.sql` | Las 16 tablas del diccionario (incluida `BitacoraErrores`) con los cambios de §3, en orden de dependencias: catálogos, entidades, transacciones y soporte | A |
| `app/03_indices.sql` | Los índices de §4 | A |
| `app/04_sps.sql` | SP01–SP19 con la plantilla de §5, y `GRANT EXECUTE ON SCHEMA::dbo TO rolCitasServicio` | H |
| `app/05_datos_iniciales.sql` | §8 | A |

**Seguridad (RNF-B07):**
- El rol `rolCitasServicio` sólo tiene `EXECUTE` sobre el esquema `dbo`; no tiene permiso directo sobre las tablas.
- El inicio de sesión y el usuario del servicio **no se crean en los scripts del repositorio**, porque llevarían contraseña. La Construcción incluye una guía en `.env.example` con los pasos y marcadores (`<usuario>`, `<contraseña>`), sin valores reales, y se avisa a la usuaria antes de crear ese archivo.
- Ningún script ni documento contiene credenciales.

## 10. Trazabilidad

### 10.1 Contrato de datos

| Punto del contrato | Dónde se especifica |
| --- | --- |
| Entidades y campos | §3 y diccionario de `BCK_DEFINICION.md` §6. Comprador opcional en Reserva y Orden (P15). |
| Garantía 1: apartado atómico | SP07, pasos 5 y 6; `UQ_AsientosFuncion_IdFuncion_IdAsiento` |
| Garantía 2: pago atómico | SP13, una sola transacción con `UPDLOCK` |
| Garantía 3: la hora la manda el servicio | `@Ahora` en SP04–SP10, SP12, SP13 y SP17, y `@ExpiraEn` en SP07 (C6) |
| Garantía 4: unicidad | `UQ_Boletos_IdFuncion_IdAsiento`, `UQ_Boletos_Codigo`, `UQ_Compradores_Correo` y SP01 con 51002 ante una carrera |
| Garantía 5: persistencia | Tablas permanentes y `COMMIT` (Propuesta §3.7) |
| Operaciones de `AsientosRepo` | SP03 (listar y obtener evento), SP04, SP05 y SP06 (zonas y asientos) |
| Operaciones de `ReservasRepo` | SP07–SP12 |
| Operaciones de `OrdenesRepo` | SP13–SP16, más SP18 (P17) |
| Barrido opcional | SP17 |
| Volumen y consultas frecuentes | §4. 31,200 asientos-función en total. |
| Datos iniciales | §8 |
| «Vencida» no se guarda | `Vencida` calculada en la forma R (RN02) |

### 10.2 Métodos de `citas_service/app/repos/interfaces.js`

| Método | SP |
| --- | --- |
| `AsientosRepo.listarEventos({ sitio })` | SP03 con `@ClaveSitio` |
| `AsientosRepo.obtenerEvento(eventoId)` | SP03 con `@IdEvento` (H2) |
| `AsientosRepo.listarFunciones(eventoId)` | SP04 |
| `AsientosRepo.obtenerFuncion(funcionId)` | SP05 |
| `AsientosRepo.listarZonas(funcionId)` | SP06, primer conjunto de resultados (H3) |
| `AsientosRepo.listarAsientos(funcionId, ahora)` | SP06, segundo conjunto de resultados |
| `ReservasRepo.crear(datos)` | SP07 |
| `ReservasRepo.obtener(reservaId, ahora)` | SP08 |
| `ReservasRepo.listarActivasDeComprador(compradorId, ahora)` | SP09 |
| `ReservasRepo.contarAsientosDeComprador(datos)` | SP10 |
| `ReservasRepo.liberar(reservaId, ahora)` | SP11 |
| `ReservasRepo.registrarPagoRechazado(datos)` | SP12 (H4) |
| `OrdenesRepo.pagar(datos)` | SP13 |
| `OrdenesRepo.obtener(ordenId)` | SP14 |
| `OrdenesRepo.listarDeComprador(compradorId)` | SP15 |
| `OrdenesRepo.listarBoletos()` | SP16 |
| Registro e inicio de sesión (P5) | SP01 y SP02 |
| Recuperar la orden sin cuenta (P17) y conteo diario (P18) | SP18 y SP19. Todavía no están en `interfaces.js`; el servicio los agregará. |

## 11. Aviso para el servicio

Estos puntos cambian lo que el servicio espera y hay que avisarlos en el chat cuando se apruebe esta Especificación:

> **Backend → Servicio (Especificación, PR pendiente):**
> Revisamos nuestros SP contra su `interfaces.js` y ajustamos lo siguiente:
> 1. **51003 ahora sólo significa «ya pagada»** (`409`). Para «reserva liberada» agregamos **52002** (`410`, `RESERVA_LIBERADA`). Lo lanzan SP11, SP12 y SP13.
> 2. `spEventos_Listar` recibe `@IdEvento` opcional para `obtenerEvento`.
> 3. `spAsientos_ListarPorFuncion` devuelve **dos conjuntos de resultados**: primero las zonas con precio y moneda (`listarZonas`) y después los asientos.
> 4. `spFunciones_ListarPorEvento` y `spFunciones_Obtener` reciben `@Ahora` y devuelven `AsientosDisponibles`, además de `Sala`, `Capacidad`, `Formato` e `Idioma` (P16).
> 5. Los SP que necesitan el sitio reciben **`@ClaveSitio`** (`web_1`, `web_2`), no el Id.
> 6. `spIntentosPago_Registrar` y `spOrdenes_Pagar` reciben `@UltimosDigitos` y validan vencida, pagada y liberada.
> 7. Error nuevo **53008** (datos del comprador incompletos, `422`) en el registro.
> 8. Las reservas y las órdenes se devuelven siempre con la misma forma (encabezado y asientos o boletos), para que usen un solo mapeador.
> Detalle en `citas_backend/docs/BCK_ESPECIFICACION.md` §2.2, §5.3 y §6.

## 12. Aprobación de cada SP

El plan de trabajo pide que la usuaria apruebe cada SP antes de construirlo.

| SP | Nombre | Prioridad | Aprobado |
| --- | --- | --- | --- |
| SP01 | `spCompradores_Registrar` | P2 | ✅ 6 nov |
| SP02 | `spCompradores_ObtenerPorCorreo` | P2 | ✅ 6 nov |
| SP03 | `spEventos_Listar` | P2 | ✅ 6 nov |
| SP04 | `spFunciones_ListarPorEvento` | P2 | ✅ 6 nov |
| SP05 | `spFunciones_Obtener` | P2 | ✅ 6 nov |
| SP06 | `spAsientos_ListarPorFuncion` | **P1** | ✅ 6 nov |
| SP07 | `spReservas_Crear` | **P1** | ✅ 6 nov |
| SP08 | `spReservas_Obtener` | P2 | ✅ 6 nov |
| SP09 | `spReservas_ListarActivasPorComprador` | P2 | ✅ 6 nov |
| SP10 | `spReservas_ContarAsientosCompradorFuncion` | P2 | ✅ 6 nov |
| SP11 | `spReservas_Liberar` | P2 | ✅ 6 nov |
| SP12 | `spIntentosPago_Registrar` | P2 | ✅ 6 nov |
| SP13 | `spOrdenes_Pagar` | **P1** | ✅ 6 nov |
| SP14 | `spOrdenes_Obtener` | P2 | ✅ 6 nov |
| SP15 | `spOrdenes_ListarPorComprador` | P2 | ✅ 6 nov |
| SP16 | `spBoletos_Consolidar` | P3 | ✅ 6 nov |
| SP17 | `spReservas_LimpiarVencidas` (opcional) | P3 | ✅ 6 nov |
| SP18 | `spOrdenes_ObtenerPorCodigo` | P2 | ✅ 6 nov |
| SP19 | `spReservas_ContarPorDia` | P2 | ✅ 6 nov |

## 13. Validación

- [x] Cada punto del contrato de datos tiene dónde especificarse (§10.1).
- [x] Cada método de `interfaces.js` tiene un SP (§10.2).
- [x] Los cambios de P15–P19 están incluidos (§2.1 y §3).
- [x] Los errores nuevos respetan los rangos de D10 y del ADR-004 (§7).
- [x] Todos los SP de tiempo reciben `@Ahora` y ninguno decide vencimientos con la hora del servidor (C6).
- [x] Los datos iniciales cuadran: 40 días de jueves a sábado entre el 1 oct y el 31 dic 2026 (15 + 12 + 13), y del 9 al 15 nov 2026 es de lunes a domingo. Ambos se verificaron con un cálculo de calendario. 14,400 + 16,800 = 31,200 asientos-función.
- [x] Sólo se usan funciones de SQL Server 2019 o anteriores (`STRING_AGG` 2017, `OPENJSON` y `ISJSON` 2016, `CREATE OR ALTER` 2016 SP1, `TRIM` 2017).
- [x] Ningún dato sensible ni credencial en este documento.
- [ ] Revisión del subagente `sqlserver-dba`: se hace en la Construcción, sobre los scripts (plan de trabajo §5).
- [x] Aprobación de la usuaria, SP por SP (§12): los 19 SP aprobados el 6 nov 2026.
