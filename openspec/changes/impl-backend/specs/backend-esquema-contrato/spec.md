## ADDED Requirements

### Requirement: Scripts de construcción
La base de datos SHALL construirse con cinco scripts numerados en `citas_backend/app/`, ejecutables en SSMS en este orden: `01_crear_bd.sql` (crea `CitasBD`), `02_tablas.sql`, `03_indices.sql`, `04_sps.sql` y `05_datos_iniciales.sql`. Cada script SHALL ser idempotente: si se vuelve a ejecutar, no duplica datos ni falla por objetos existentes.

Mientras la Etapa 5 no esté terminada, los cambios de esquema de este change se escriben directamente en `02_tablas.sql` y en `04_sps.sql`, porque aún no hay base de datos desplegada (D8).

#### Scenario: Reejecución
- **WHEN** un operador ejecuta de nuevo los cinco scripts
- **THEN** la base queda igual, sin filas duplicadas y sin errores

### Requirement: Sitios y compradores opcionales
La tabla `Sitios` SHALL tener la columna `RequiereComprador BIT NOT NULL`, con valor `1` para `web_1` y `0` para `web_2`. `Reservas.IdComprador` y `Ordenes.IdComprador` SHALL admitir `NULL`. Cuando el sitio tiene `RequiereComprador = 0`, la reserva y la orden se guardan sin comprador.

Los procedimientos que reciben un comprador SHALL validar que el sitio lo exija: si `RequiereComprador = 1` y el comprador es `NULL`, lanzan `53005`; si `RequiereComprador = 0` y se envía un comprador, lanzan `53006`.

#### Scenario: Orden de web_2 sin comprador
- **WHEN** `web_2` paga una reserva sin comprador
- **THEN** `Ordenes.IdComprador` queda `NULL` y la orden se guarda con `Sitio = web_2`

### Requirement: Campos de función y zona para web_2
La tabla `Zonas` SHALL tener `Capacidad INT NULL`. La tabla `Funciones` SHALL tener `Formato VARCHAR(10) NULL` (valores `2D`, `3D` o `NULL`), `Idioma NVARCHAR(40) NULL`, `Clasificacion NVARCHAR(20) NULL` y `DuracionMinutos INT NULL`. Para web_1 esos campos quedan `NULL`; para web_2 se llenan en la semilla.

#### Scenario: Función de web_2
- **WHEN** se consulta una función de la sala 6
- **THEN** `Formato = "3D"` y `DuracionMinutos = 120`

### Requirement: Pagos con últimos dígitos
La tabla `IntentosPago` SHALL tener `UltimosDigitos CHAR(4) NOT NULL`. La base de datos NUNCA SHALL guardar el número completo de tarjeta ni el CVV (D14, P19).

#### Scenario: Intento rechazado
- **WHEN** se registra un intento rechazado con la tarjeta `4000 0000 0000 0002`
- **THEN** `UltimosDigitos = "0002"` y no existe ninguna columna con el número completo

### Requirement: Procedimientos del contrato
Los procedimientos SHALL tener estas firmas. Cualquier nombre o parámetro fuera de esta lista no forma parte del contrato.

| SP | Firma | Notas |
| --- | --- | --- |
| SP01 `spCompradores_Registrar` | `@Sitio, @Nombre, @Correo, @HashContrasena` → `Id` | `51002` si el correo ya existe; `53008` si faltan datos |
| SP02 `spCompradores_ObtenerPorCorreo` | `@Correo` → fila con `Id` y `HashContrasena` | Sin resultado si no existe |
| SP03 `spEventos_Listar` | `@Sitio` | Solo eventos activos |
| SP04 `spFunciones_ListarPorEvento` | `@EventoId` | `54002` si el evento no existe |
| SP05 `spFunciones_Obtener` | `@FuncionId` | Incluye formato, idioma, clasificación y duración |
| SP06 `spAsientos_ListarPorFuncion` | `@FuncionId, @Ahora` | Devuelve `Estado` (`Disponible`, `Apartado`, `Vendido`) y `ExpiraEn` |
| SP07 `spReservas_Crear` | `@Sitio, @CompradorId NULL, @FuncionId, @AsientoIds (lista CSV), @Ahora, @ExpiraEn, @LimiteAsientos NULL` | Ver reglas de reserva |
| SP08 `spReservas_Obtener` | `@ReservaId, @Sitio, @Ahora` | `54003` si no existe o es de otro sitio |
| SP09 `spReservas_ListarActivasPorComprador` | `@CompradorId, @Ahora` | Solo `Estado = activa` y `ExpiraEn > @Ahora` |
| SP10 `spReservas_ContarAsientosCompradorFuncion` | `@CompradorId, @FuncionId, @Ahora` | Boletos + asientos vigentes |
| SP11 `spReservas_Liberar` | `@ReservaId, @Sitio, @Ahora` | Ver códigos de liberar |
| SP12 `spIntentosPago_Registrar` | `@ReservaId, @Resultado ('rechazado'), @UltimosDigitos, @Ahora` | Solo registra; la reserva sigue `activa` |
| SP13 `spOrdenes_Pagar` | `@ReservaId, @UltimosDigitos, @Ahora` → orden y boletos | Atómico (ver RN07 del contrato) |
| SP14 `spOrdenes_Obtener` | `@OrdenId, @Sitio` | `54004` si no existe o es de otro sitio |
| SP15 `spOrdenes_ListarPorComprador` | `@CompradorId` | Más antigua primero |
| SP16 `spBoletos_Consolidar` | `@Sitio, @Desde, @Hasta` | Consolidación de boletos (RF15 del backend) |
| SP17 `spReservas_LimpiarVencidas` | `@Ahora` | Opcional; solo limpieza |
| SP18 `spOrdenes_Buscar` | `@Sitio, @Folio NULL, @Codigo NULL` | Reemplaza `spOrdenes_ObtenerPorCodigo`. Exactamente uno de `@Folio` o `@Codigo`; si no, `53002` |
| SP19 `spReservas_ContarPorDia` | `@Sitio, @Desde, @Hasta` | Día calendario de `CreadaEn` en `America/Mexico_City` (UTC−6), sin importar el estado |

#### Scenario: Búsqueda inválida
- **WHEN** `spOrdenes_Buscar` recibe `@Folio` y `@Codigo` al mismo tiempo
- **THEN** lanza `53002`

### Requirement: Reglas de apartado
`spReservas_Crear` SHALL aceptar una lista CSV de 1 a 10 asientos sin repetidos, todos de la misma función. Si alguno no está disponible en `@Ahora`, no aparta ninguno: lanza `51001` con el mensaje `Asientos no disponibles: 12,15,18` (formato fijo de D11, QB3). Si `@LimiteAsientos` no es `NULL`, valida el límite con SP10 dentro de la misma transacción y lanza `53001` al excederlo. Si `@ExpiraEn <= @Ahora`, lanza `53004`.

La operación SHALL usar transacción con bloqueo y el índice único `UQ_Funciones_IdEvento_FechaHoraInicio` (D6). Si el número de filas afectadas no coincide con los asientos pedidos, revierte todo.

#### Scenario: Asiento ocupado dentro del CSV
- **WHEN** la lista `12,15` incluye un asiento ya apartado
- **THEN** no queda apartado ninguno y el mensaje de `51001` contiene `12,15` o solo el id ocupado

### Requirement: Códigos de error del contrato
Los procedimientos SHALL lanzar estos códigos. Cuando un código existe en el contrato, el servicio lo traduce como se define en el contrato compartido.

| Código | Significado |
| --- | --- |
| 50000 | Error no previsto |
| 51001 | Asientos no disponibles |
| 51002 | Correo ya registrado |
| 51003 | Reserva ya pagada (solo pagada) |
| 52001 | Reserva vencida |
| 52002 | Reserva ya liberada (**nuevo**: antes estaba dentro de `51003`) |
| 53001 | Límite de 10 asientos excedido |
| 53002 | Lista de asientos o búsqueda inválida |
| 53003 | Asiento que no pertenece a la función |
| 53004 | `@ExpiraEn` no posterior a `@Ahora` (error del servicio) |
| 53005 | Comprador obligatorio en el sitio, pero ausente |
| 53006 | Comprador enviado en un sitio que no lo usa |
| 53007 | Sitio no válido |
| 53008 | Datos del comprador incompletos |
| 54001 | Función no encontrada |
| 54002 | Evento no encontrado |
| 54003 | Reserva no encontrada en el sitio |
| 54004 | Orden no encontrada en el sitio |
| 54005 | Sitio o evento no encontrado |

#### Scenario: Liberar una reserva ya liberada
- **WHEN** `spReservas_Liberar` recibe una reserva con `Estado = liberada`
- **THEN** lanza `52002`

### Requirement: Semilla de web_1 y web_2
`05_datos_iniciales.sql` SHALL cargar exactamente los datos del Requirement «Semilla de datos acordada» de `contrato-entre-capas`: 120 funciones y 360 precios para web_1, y 10 salas, 800 asientos y 900 funciones para web_2. La carga SHALL ser idempotente y usar horas en UTC (CDMX + 6 h).

#### Scenario: Conteos de la semilla
- **WHEN** termina `05_datos_iniciales.sql`
- **THEN** hay 120 funciones de web_1, 360 precios de web_1, 800 asientos de web_2 y 900 funciones de web_2

### Requirement: Pruebas de base de datos
Debe existir un conjunto de pruebas en `citas_backend/tests/` que cubra: apartado concurrente (dos ejecuciones por el mismo asiento producen una sola reserva), vencimiento con `@Ahora`, límite de 10, pago atómico con fallo simulado, unicidad de folio y código, y `RequiereComprador`.

#### Scenario: Apartado concurrente
- **WHEN** dos ejecuciones de `spReservas_Crear` piden el mismo asiento a la vez
- **THEN** una termina bien y la otra lanza `51001`
