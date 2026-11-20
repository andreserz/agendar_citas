/* =============================================================
   03_indices.sql — Índices de CitasBD
   -------------------------------------------------------------
   Proyecto : citas_backend (change impl-backend, tareas 3.1 a 3.3)
   Ejecutar : después de 02_tablas.sql.
   Fuentes  : backend-esquema-contrato (D6) y BCK_ESPECIFICACION.md §4.

   Las PK y las UQ de 02_tablas.sql ya crean su propio índice. Aquí van:
     - UQ_Funciones_IdEvento_FechaHoraInicio (tarea 3.1). Conserva el
       nombre del contrato e incluye IdZona: en web_2 varias salas del
       mismo evento tienen función a la misma hora (aprobado por la
       usuaria el 20 nov 2026). Un índice único trata los NULL como
       iguales, así que web_1 (IdZona NULL) conserva la misma protección.
     - UQ_AsientosFuncion_IdFuncion_IdAsiento, que lleva INCLUDE.
     - Los índices IX_ de apoyo a los procedimientos.

   Tarea 3.2: la búsqueda por Folio y por Codigo (spOrdenes_Buscar) usa
   UQ_Ordenes_Folio y UQ_Boletos_Codigo, creados en 02_tablas.sql; aquí
   sólo se verifica que existan.

   Idempotente: cada índice se crea sólo si no existe.
   ============================================================= */
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;   -- requerido por los índices filtrados
GO

USE CitasBD;
GO

-- Tarea 3.1. Una función por evento, hora de inicio y sala. Lo usan SP04 y SP05.
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.Funciones') AND name = N'UQ_Funciones_IdEvento_FechaHoraInicio')
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Funciones_IdEvento_FechaHoraInicio
        ON dbo.Funciones (IdEvento, FechaHoraInicio, IdZona);
GO

-- Un asiento una sola vez por función; cubre la lectura de estado (SP04 a SP07, SP13).
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.AsientosFuncion') AND name = N'UQ_AsientosFuncion_IdFuncion_IdAsiento')
    CREATE UNIQUE NONCLUSTERED INDEX UQ_AsientosFuncion_IdFuncion_IdAsiento
        ON dbo.AsientosFuncion (IdFuncion, IdAsiento)
        INCLUDE (Vendido, ExpiraEn, IdReservaActual);
GO

-- Asientos de una reserva, sólo los que tienen reserva (SP11, SP13, SP17).
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.AsientosFuncion') AND name = N'IX_AsientosFuncion_IdReservaActual')
    CREATE NONCLUSTERED INDEX IX_AsientosFuncion_IdReservaActual
        ON dbo.AsientosFuncion (IdReservaActual)
        WHERE IdReservaActual IS NOT NULL;
GO

-- Reservas activas del comprador en la función: límite de 10 (SP07, SP09, SP10).
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.Reservas') AND name = N'IX_Reservas_IdComprador_IdFuncion_IdEstadoReserva')
    CREATE NONCLUSTERED INDEX IX_Reservas_IdComprador_IdFuncion_IdEstadoReserva
        ON dbo.Reservas (IdComprador, IdFuncion, IdEstadoReserva)
        INCLUDE (ExpiraEn);
GO

-- Limpieza de reservas vencidas (SP17).
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.Reservas') AND name = N'IX_Reservas_IdEstadoReserva_ExpiraEn')
    CREATE NONCLUSTERED INDEX IX_Reservas_IdEstadoReserva_ExpiraEn
        ON dbo.Reservas (IdEstadoReserva, ExpiraEn);
GO

-- Tarea 3.3. Conteo diario de reservas por sitio (SP19, P18).
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.Reservas') AND name = N'IX_Reservas_IdSitio_CreadaEn')
    CREATE NONCLUSTERED INDEX IX_Reservas_IdSitio_CreadaEn
        ON dbo.Reservas (IdSitio, CreadaEn)
        INCLUDE (IdEstadoReserva);
GO

-- Intentos de una reserva; últimos dígitos del intento aprobado (SP14, SP18).
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.IntentosPago') AND name = N'IX_IntentosPago_IdReserva')
    CREATE NONCLUSTERED INDEX IX_IntentosPago_IdReserva
        ON dbo.IntentosPago (IdReserva)
        INCLUDE (IdResultadoPago, UltimosDigitos);
GO

-- Órdenes del comprador (SP15).
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.Ordenes') AND name = N'IX_Ordenes_IdComprador')
    CREATE NONCLUSTERED INDEX IX_Ordenes_IdComprador
        ON dbo.Ordenes (IdComprador)
        INCLUDE (FechaCompra, Total);
GO

-- Boletos de una orden (SP13 a SP16, SP18).
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE object_id = OBJECT_ID(N'dbo.Boletos') AND name = N'IX_Boletos_IdOrden')
    CREATE NONCLUSTERED INDEX IX_Boletos_IdOrden
        ON dbo.Boletos (IdOrden);
GO

-- =============================================================
-- PRUEBAS / VERIFICACIÓN
-- =============================================================
-- Esperado: 11 filas, todas con Existe = 1 (9 de este script y 2 de 02_tablas.sql para la tarea 3.2).
SELECT  e.Tabla, e.Indice,
        CASE WHEN i.index_id IS NULL THEN 0 ELSE 1 END AS Existe,
        i.is_unique AS Unico,
        i.filter_definition AS Filtro
FROM   (VALUES (N'Funciones',       N'UQ_Funciones_IdEvento_FechaHoraInicio'),
               (N'AsientosFuncion', N'UQ_AsientosFuncion_IdFuncion_IdAsiento'),
               (N'AsientosFuncion', N'IX_AsientosFuncion_IdReservaActual'),
               (N'Reservas',        N'IX_Reservas_IdComprador_IdFuncion_IdEstadoReserva'),
               (N'Reservas',        N'IX_Reservas_IdEstadoReserva_ExpiraEn'),
               (N'Reservas',        N'IX_Reservas_IdSitio_CreadaEn'),
               (N'IntentosPago',    N'IX_IntentosPago_IdReserva'),
               (N'Ordenes',         N'IX_Ordenes_IdComprador'),
               (N'Boletos',         N'IX_Boletos_IdOrden'),
               (N'Ordenes',         N'UQ_Ordenes_Folio'),       -- tarea 3.2
               (N'Boletos',         N'UQ_Boletos_Codigo')       -- tarea 3.2
       ) AS e (Tabla, Indice)
LEFT JOIN sys.indexes AS i
       ON i.object_id = OBJECT_ID(N'dbo.' + e.Tabla) AND i.name = e.Indice
ORDER BY e.Tabla, e.Indice;

-- Tarea 3.1. Esperado: 3 filas en orden IdEvento, FechaHoraInicio, IdZona. Si falta IdZona,
-- existe un índice anterior con el mismo nombre: hay que borrarlo y volver a ejecutar este script.
SELECT ic.key_ordinal AS Orden, c.name AS Columna
FROM   sys.indexes       AS i
JOIN   sys.index_columns AS ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN   sys.columns       AS c  ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE  i.object_id = OBJECT_ID(N'dbo.Funciones')
  AND  i.name = N'UQ_Funciones_IdEvento_FechaHoraInicio'
  AND  ic.key_ordinal > 0
ORDER BY ic.key_ordinal;
GO
