# backend-base-datos

## Purpose

Base de datos de `citas_backend` en SQL Server: esquema, procedimientos almacenados (SP01–SP19), índices, manejo de errores y datos iniciales. Fuente: `citas_backend/docs/BCK_ESPECIFICACION.md` (aprobada el 6 nov 2026), `BCK_DEFINICION.md`, `BCK_PROPUESTA.md`, `BCK_RESPUESTAS_P15_P19.md`, ADR-001 a ADR-004 y `architecture/BCK_DIAGRAMA_ER.md`.

**Estado general: diseño completo, construcción pendiente.** La Etapa 4 (Especificación) está aprobada. La Etapa 5 (scripts `app/01_crear_bd.sql` a `app/05_datos_iniciales.sql`) y la Etapa 6 (pruebas) aparecen como pendientes en `citas_backend/TODOLIST.md`. Hoy el repositorio `citas_backend` solo contiene documentación: no hay scripts SQL.

## Requirements

### Requirement: Motor y forma de entrega
La base de datos SHALL ser Microsoft SQL Server 2019 o superior (D5). Se entrega como scripts `.sql` numerados que se ejecutan en SSMS, sin Docker. Los datos de conexión van en un `.env.example` sin contraseñas reales.

**Estado:** pendiente (Etapa 5).

#### Scenario: Orden de ejecución
- **WHEN** un operador ejecuta los scripts
- **THEN** los ejecuta en el orden `01` (crear BD), `02` (tablas), `03` (índices), `04` (procedimientos) y `05` (datos iniciales)

### Requirement: Acceso solo por procedimientos almacenados
`citas_service` SHALL acceder a la base de datos solo mediante procedimientos almacenados (D4). El servicio NO SHALL escribir consultas SQL directas.

**Estado:** diseño aprobado. El adaptador SQL del servicio está pendiente (ADR-004 del servicio).

#### Scenario: Consulta directa
- **WHEN** el servicio necesita leer reservas
- **THEN** llama a `spReservas_Obtener` y no ejecuta un `SELECT` propio

### Requirement: Catálogo de procedimientos
La base de datos SHALL exponer los siguientes procedimientos, con las firmas de `BCK_ESPECIFICACION.md` §6:

| SP | Nombre | Prioridad |
| --- | --- | --- |
| SP01 | `spCompradores_Registrar` | P2 |
| SP02 | `spCompradores_ObtenerPorCorreo` | P2 |
| SP03 | `spEventos_Listar` | P2 |
| SP04 | `spFunciones_ListarPorEvento` | P2 |
| SP05 | `spFunciones_Obtener` | P2 |
| SP06 | `spAsientos_ListarPorFuncion` | **P1** |
| SP07 | `spReservas_Crear` | **P1** |
| SP08 | `spReservas_Obtener` | P2 |
| SP09 | `spReservas_ListarActivasPorComprador` | P2 |
| SP10 | `spReservas_ContarAsientosCompradorFuncion` | P2 |
| SP11 | `spReservas_Liberar` | P2 |
| SP12 | `spIntentosPago_Registrar` | P2 |
| SP13 | `spOrdenes_Pagar` | **P1** |
| SP14 | `spOrdenes_Obtener` | P2 |
| SP15 | `spOrdenes_ListarPorComprador` | P2 |
| SP16 | `spBoletos_Consolidar` | P3 |
| SP17 | `spReservas_LimpiarVencidas` (opcional) | P3 |
| SP18 | `spOrdenes_ObtenerPorCodigo` | P2 |
| SP19 | `spReservas_ContarPorDia` | P2 |

Los SP de prioridad P1 SHALL construirse primero: SP06, SP07 y SP13 (`citas_backend/TODOLIST.md`, Etapa 5).

**Estado:** firmas aprobadas; ningún script creado.

#### Scenario: Procedimientos P1 primero
- **WHEN** comienza la Etapa 5
- **THEN** los scripts de SP06, SP07 y SP13 se escriben antes que el resto

### Requirement: Tiempo en la base de datos
Todas las fechas SHALL guardarse en UTC (E6, E18, RN24). Los procedimientos que dependen del tiempo SHALL recibir `@Ahora` y no usar `SYSDATETIME()` para decidir vencimientos (E7, ADR-003 del backend). `spReservas_Crear` SHALL recibir además `@ExpiraEn` (E15).

**Estado:** diseñado; pendiente de construcción.

#### Scenario: Vencimiento
- **WHEN** `spReservas_Crear` recibe `@ExpiraEn` no posterior a `@Ahora`
- **THEN** lanza `53004`, que el servicio responde como `500`

### Requirement: Apartado atómico y concurrencia
El apartado y el pago SHALL ser atómicos (D6, ADR-002). Se usan transacción, bloqueo y el índice único `UQ_Funciones_IdEvento_FechaHoraInicio`. Si el número de filas afectadas no coincide con los asientos pedidos, se revierte todo y `spReservas_Crear` lanza `51001` con los Id de los asientos fallidos en el mensaje, con el formato `Asientos no disponibles: 12,15,18` (D11, QB3).

**Estado:** diseñado; pendiente de construcción y pruebas (Etapa 6: apartado concurrente, vencimiento, límite, pago atómico y unicidad).

#### Scenario: Asiento ocupado
- **WHEN** un asiento de la lista ya está apartado
- **THEN** no se aparta ninguno y el mensaje de error contiene los Id de los asientos en conflicto

### Requirement: Errores por rangos
Los procedimientos SHALL lanzar `THROW` con códigos agrupados por rango (ADR-004, D10):

| Rango | Significado |
| --- | --- |
| 50000 | Error no previsto |
| 51000–51999 | Conflicto de estado (asientos no disponibles, reserva pagada, correo registrado) |
| 52000–52999 | Vencimiento |
| 53000–53999 | Regla de negocio o datos inválidos (límite, lista inválida, asiento ajeno, datos incompletos) |
| 54000–54999 | No encontrado |

La lista completa está en `BCK_ESPECIFICACION.md` §7 (códigos 53005–53007 para P15, y 53008 para datos vacíos del comprador).

**Estado:** diseñado.

#### Scenario: Código no previsto
- **WHEN** ocurre un error sin código propio
- **THEN** el procedimiento lanza `50000`

### Requirement: Compradores sin cuenta
Para web_2 (P15), `Reservas.IdComprador` y `Ordenes.IdComprador` SHALL admitir nulos. Se agrega `Sitios.RequiereComprador`. Las reglas RN06 y RN09 se ajustan y se agregan RN28 y RN29 (error 53005). Pendiente que el servicio confirme el uso.

**Estado:** aprobado en `BCK_RESPUESTAS_P15_P19.md` y reflejado en la Especificación (§2.1).

#### Scenario: Orden sin comprador
- **WHEN** web_2 crea una orden sin cuenta
- **THEN** `Ordenes.IdComprador` queda nulo y la orden queda asociada al sitio

### Requirement: Conteo diario de reservas
El backend SHALL ofrecer `spReservas_ContarPorDia` (SP19, P18) para el conteo diario de web_2: reservas creadas por día calendario en `America/Mexico_City`, sin importar su estado final y sin desglose por sala (RN06 de web_2).

**Estado:** firma aprobada; pendiente de construcción.

#### Scenario: Día con reservas vencidas
- **WHEN** un día tiene 5 reservas, 2 vencidas y 1 liberada
- **THEN** el conteo de ese día es 5

### Requirement: Datos iniciales de web_1
`05_datos_iniciales.sql` SHALL cargar 1 sitio, 1 evento, 3 zonas (Preferente $800, General $500, Balcón $300), 120 asientos, 120 funciones y 360 precios (zona × función). Los datos de web_2 se cargan cuando se confirme P4 (D7, P3).

**Estado:** pendiente.

#### Scenario: Conteo de funciones
- **WHEN** termina el script de datos iniciales
- **THEN** existen 120 funciones del evento de web_1

## Discrepancias y pendientes

- D7 dice «14,400 asientos por función». La cuenta correcta es 120 funciones × 120 asientos = 14,400 asientos-función en total, no por función. Corregir la redacción en `ACUERDOS.md`.
- web_2 necesita sala (nombre y capacidad), formato, idioma, clasificación y duración (P16). No hay columnas para eso en el esquema.
- Falta la respuesta del backend a P17 (búsqueda por folio) y a P19 (`UltimosDigitos CHAR(4)`).
