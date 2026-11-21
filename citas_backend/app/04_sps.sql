/* =============================================================
   04_sps.sql — Procedimientos almacenados de CitasBD
   -------------------------------------------------------------
   Proyecto : citas_backend (change impl-backend)
   Ejecutar : después de 03_indices.sql.
   Fuentes  : backend-esquema-contrato (firmas y códigos; manda si hay
              diferencia), contrato-entre-capas, BCK_ESPECIFICACION.md
              §5 (plantilla) y §6 (lógica de cada SP).

   Contenido: SP01 a SP19 del contrato (tareas 4.1 a 4.3 y 5.1 a 5.8),
   cinco funciones en línea internas (formas R y O, y la cuenta del límite
   que comparten SP07 y SP10) y el permiso EXECUTE del rol del servicio.

   Plantilla (§5.1): CREATE OR ALTER (idempotente), SET NOCOUNT ON y
   XACT_ABORT ON, TRY/CATCH en todos, THROW con códigos de negocio,
   fechas UTC recibidas en @Ahora (nunca SYSUTCDATETIME() para decidir).
   Errores no previstos: se guardan en BitacoraErrores y se lanza 50000.

   Id de reserva: el servicio sólo ve Reservas.IdPublico (UUID v4); los
   parámetros @ReservaId y la columna IdReserva de los resultados son ese UUID.
   ============================================================= */
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE CitasBD;
GO

/* ===================== Funciones internas (formas R y O) =====================
   Funciones en línea: no son parte del contrato y el rol del servicio no
   puede llamarlas directamente (sólo tiene EXECUTE); los SP las usan por
   encadenamiento de propiedad. */

-- Forma R1: encabezado de una reserva. Vencida = 1 sólo si está Activa y ExpiraEn <= @Ahora (RN02).
CREATE OR ALTER FUNCTION dbo.fnReservas_Encabezado (@IdReserva BIGINT, @Ahora DATETIME2(3))
RETURNS TABLE
AS
RETURN
    SELECT  r.IdPublico                                   AS IdReserva,
            s.Clave                                       AS ClaveSitio,
            r.IdComprador,
            r.IdFuncion,
            er.Descripcion                                AS Estado,
            CAST(CASE WHEN er.Descripcion = N'Activa' AND r.ExpiraEn <= @Ahora
                      THEN 1 ELSE 0 END AS BIT)           AS Vencida,
            r.CreadaEn,
            r.ExpiraEn,
            r.Total,
            (SELECT MAX(p.Moneda) FROM dbo.PreciosZonaFuncion AS p
              WHERE p.IdFuncion = r.IdFuncion)            AS Moneda,   -- una moneda por función (RN32)
            o.Id                                          AS IdOrden
    FROM    dbo.Reservas       AS r
    JOIN    dbo.Sitios         AS s  ON s.Id  = r.IdSitio
    JOIN    dbo.EstadosReserva AS er ON er.Id = r.IdEstadoReserva
    LEFT JOIN dbo.Ordenes      AS o  ON o.IdReserva = r.Id
    WHERE   r.Id = @IdReserva;
GO

-- Forma R2: asientos de una reserva con el precio tomado (RN10).
CREATE OR ALTER FUNCTION dbo.fnReservas_Asientos (@IdReserva BIGINT)
RETURNS TABLE
AS
RETURN
    SELECT  r.IdPublico   AS IdReserva,
            a.Id          AS IdAsiento,
            a.Etiqueta,
            a.IdZona,
            ra.PrecioTomado,
            a.Fila,                       -- sólo para ordenar
            a.Numero
    FROM    dbo.ReservasAsientos AS ra
    JOIN    dbo.Reservas         AS r ON r.Id = ra.IdReserva
    JOIN    dbo.Asientos         AS a ON a.Id = ra.IdAsiento
    WHERE   ra.IdReserva = @IdReserva;
GO

-- Forma O1: encabezado de una orden, con los últimos dígitos del intento aprobado.
CREATE OR ALTER FUNCTION dbo.fnOrdenes_Encabezado (@IdOrden BIGINT)
RETURNS TABLE
AS
RETURN
    SELECT  o.Id            AS IdOrden,
            o.Folio,
            r.IdPublico     AS IdReserva,
            s.Clave         AS ClaveSitio,
            o.IdComprador,
            o.FechaCompra,
            o.Total,
            (SELECT MAX(p.Moneda) FROM dbo.PreciosZonaFuncion AS p
              WHERE p.IdFuncion = r.IdFuncion)                       AS Moneda,
            (SELECT TOP (1) ip.UltimosDigitos
               FROM dbo.IntentosPago   AS ip
               JOIN dbo.ResultadosPago AS rp ON rp.Id = ip.IdResultadoPago
              WHERE ip.IdReserva = o.IdReserva AND rp.Descripcion = N'Aprobado'
              ORDER BY ip.Id DESC)                                    AS UltimosDigitos
    FROM    dbo.Ordenes  AS o
    JOIN    dbo.Reservas AS r ON r.Id = o.IdReserva
    JOIN    dbo.Sitios   AS s ON s.Id = o.IdSitio
    WHERE   o.Id = @IdOrden;
GO

-- Forma O2: boletos de una orden con evento, función, zona y asiento.
CREATE OR ALTER FUNCTION dbo.fnOrdenes_Boletos (@IdOrden BIGINT)
RETURNS TABLE
AS
RETURN
    SELECT  b.IdOrden,
            b.Id               AS IdBoleto,
            b.Codigo,
            e.Id               AS IdEvento,
            e.Nombre           AS NombreEvento,
            f.Id               AS IdFuncion,
            f.FechaHoraInicio,
            z.Id               AS IdZona,
            z.Descripcion      AS Zona,
            a.Id               AS IdAsiento,
            a.Etiqueta,
            b.Precio
    FROM    dbo.Boletos   AS b
    JOIN    dbo.Funciones AS f ON f.Id = b.IdFuncion
    JOIN    dbo.Eventos   AS e ON e.Id = f.IdEvento
    JOIN    dbo.Asientos  AS a ON a.Id = b.IdAsiento
    JOIN    dbo.Zonas     AS z ON z.Id = a.IdZona
    WHERE   b.IdOrden = @IdOrden;
GO

-- Asientos del comprador en una función: apartados vigentes + comprados. La usan SP07 y SP10 (RN09).
CREATE OR ALTER FUNCTION dbo.fnReservas_ContarAsientosComprador (@CompradorId INT, @FuncionId INT, @Ahora DATETIME2(3))
RETURNS TABLE
AS
RETURN
    SELECT  c.Apartados, c.Comprados, c.Apartados + c.Comprados AS Total
    FROM   (SELECT (SELECT COUNT(*)
                    FROM   dbo.Reservas         AS r
                    JOIN   dbo.EstadosReserva   AS er ON er.Id = r.IdEstadoReserva
                    JOIN   dbo.ReservasAsientos AS ra ON ra.IdReserva = r.Id
                    WHERE  r.IdComprador = @CompradorId AND r.IdFuncion = @FuncionId
                      AND  er.Descripcion = N'Activa' AND r.ExpiraEn > @Ahora) AS Apartados,
                   (SELECT COUNT(*)
                    FROM   dbo.Boletos AS b
                    JOIN   dbo.Ordenes AS o ON o.Id = b.IdOrden
                    WHERE  o.IdComprador = @CompradorId AND b.IdFuncion = @FuncionId) AS Comprados
           ) AS c;
GO

/* ============================ SP06 (tarea 4.1) ============================ */
-- Zonas con su precio y asientos con su estado en @Ahora (RN01). No revela quién
-- apartó o compró (C10). Estado: Disponible | Apartado | Vendido.
CREATE OR ALTER PROCEDURE dbo.spAsientos_ListarPorFuncion
    @FuncionId  INT,
    @Ahora      DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1
                       FROM   dbo.Funciones AS f
                       JOIN   dbo.Eventos   AS e ON e.Id = f.IdEvento
                       WHERE  f.Id = @FuncionId AND f.Activo = 1 AND e.Activo = 1)
            THROW 54001, N'Función no encontrada', 1;

        -- 1. Zonas de la función con su precio (H3).
        SELECT  z.Id           AS IdZona,
                z.Descripcion  AS Zona,
                p.Precio,
                p.Moneda
        FROM    dbo.PreciosZonaFuncion AS p
        JOIN    dbo.Zonas              AS z ON z.Id = p.IdZona
        WHERE   p.IdFuncion = @FuncionId AND z.Activo = 1
        ORDER BY p.Precio DESC, z.Id;

        -- 2. Asientos con estado calculado. ExpiraEn sólo cuando está Apartado.
        SELECT  a.Id       AS IdAsiento,
                a.IdZona,
                a.Fila,
                a.Numero,
                a.Etiqueta,
                p.Precio,
                CASE WHEN af.Vendido = 1                                         THEN N'Vendido'
                     WHEN af.IdReservaActual IS NOT NULL AND af.ExpiraEn > @Ahora THEN N'Apartado'
                     ELSE N'Disponible' END                                       AS Estado,
                CASE WHEN af.Vendido = 0 AND af.IdReservaActual IS NOT NULL AND af.ExpiraEn > @Ahora
                     THEN af.ExpiraEn END                                         AS ExpiraEn
        FROM    dbo.AsientosFuncion    AS af
        JOIN    dbo.Asientos           AS a ON a.Id = af.IdAsiento
        JOIN    dbo.Zonas              AS z ON z.Id = a.IdZona
        JOIN    dbo.PreciosZonaFuncion AS p ON p.IdFuncion = af.IdFuncion AND p.IdZona = a.IdZona
        WHERE   af.IdFuncion = @FuncionId AND a.Activo = 1 AND z.Activo = 1
        ORDER BY a.Fila, a.Numero;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;

        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());

        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ============================ SP07 (tarea 4.2) ============================ */
-- Aparta de 1 a 10 asientos de una función, todo o nada (RN08).
-- @AsientoIds: lista CSV de Id de asiento, por ejemplo '12,15,18'.
-- @LimiteAsientos: sólo lo envía el servicio cuando el sitio lo exige (web_1 = 10).
-- Si algún asiento no está disponible: devuelve los fallidos y lanza 51001
-- con el mensaje fijo 'Asientos no disponibles: 12,15' (D11, QB3).
CREATE OR ALTER PROCEDURE dbo.spReservas_Crear
    @Sitio           VARCHAR(20),
    @CompradorId     INT            = NULL,
    @FuncionId       INT,
    @AsientoIds      NVARCHAR(4000),   -- holgado; más de 400 caracteres se rechaza con 53002
    @Ahora           DATETIME2(3),
    @ExpiraEn        DATETIME2(3),
    @LimiteAsientos  TINYINT        = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdSitio            INT,
            @RequiereComprador  BIT,
            @IdEstadoActiva     TINYINT,
            @Cantidad           INT,
            @Ocupados           INT,
            @Bloqueo            INT,
            @Total              DECIMAL(12,2),
            @IdReserva          BIGINT,
            @Mensaje            NVARCHAR(2048);

    DECLARE @Lista      TABLE (Valor NVARCHAR(400), IdAsiento INT);
    DECLARE @Solicitados TABLE (IdAsiento INT PRIMARY KEY, IdZona INT, Precio DECIMAL(10,2));
    -- Las variables de tabla conservan sus filas después de un ROLLBACK.
    DECLARE @Fallidos   TABLE (IdAsiento INT PRIMARY KEY, Etiqueta VARCHAR(10), Motivo NVARCHAR(20));
    DECLARE @Nueva      TABLE (Id BIGINT);

    BEGIN TRY
        -- 1. Vencimiento posterior a la hora actual (RN07).
        IF @Ahora IS NULL OR @ExpiraEn IS NULL OR @ExpiraEn <= @Ahora
            THROW 53004, N'La fecha de vencimiento debe ser posterior a la hora actual', 1;

        -- 2. Sitio válido y activo.
        SELECT @IdSitio = Id, @RequiereComprador = RequiereComprador
        FROM   dbo.Sitios
        WHERE  Clave = @Sitio AND Activo = 1;

        IF @IdSitio IS NULL
            THROW 53007, N'Sitio no válido', 1;

        -- 3. Comprador según el sitio (RN28).
        IF @RequiereComprador = 1 AND @CompradorId IS NULL
            THROW 53005, N'El sitio requiere un comprador', 1;
        IF @RequiereComprador = 0 AND @CompradorId IS NOT NULL
            THROW 53006, N'El sitio no usa comprador', 1;
        IF @CompradorId IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM dbo.Compradores WHERE Id = @CompradorId AND Activo = 1)
            THROW 53005, N'El sitio requiere un comprador', 1;

        -- 4. Función activa, de un evento activo del sitio (RN05).
        IF NOT EXISTS (SELECT 1
                       FROM   dbo.Funciones AS f
                       JOIN   dbo.Eventos   AS e ON e.Id = f.IdEvento
                       WHERE  f.Id = @FuncionId AND f.Activo = 1
                         AND  e.Activo = 1 AND e.IdSitio = @IdSitio)
            THROW 54001, N'Función no encontrada', 1;

        -- 5. Lista CSV: de 1 a 10 enteros positivos, sin repetidos (RN03).
        INSERT INTO @Lista (Valor, IdAsiento)
        SELECT LTRIM(RTRIM(value)), TRY_CAST(LTRIM(RTRIM(value)) AS INT)
        FROM   STRING_SPLIT(ISNULL(@AsientoIds, N''), N',');

        SELECT @Cantidad = COUNT(*) FROM @Lista;

        IF LEN(ISNULL(@AsientoIds, N'')) > 400
           OR @Cantidad NOT BETWEEN 1 AND 10
           OR EXISTS (SELECT 1 FROM @Lista WHERE IdAsiento IS NULL OR IdAsiento <= 0)
           OR (SELECT COUNT(DISTINCT IdAsiento) FROM @Lista) <> @Cantidad
            THROW 53002, N'Lista de asientos vacía, repetida, inválida o de más de 10', 1;

        -- 6. Cada asiento existe en la función, está activo y su zona tiene precio en la función (RN04, RN26).
        INSERT INTO @Solicitados (IdAsiento, IdZona, Precio)
        SELECT  l.IdAsiento, a.IdZona, p.Precio
        FROM    @Lista                 AS l
        JOIN    dbo.AsientosFuncion    AS af ON af.IdAsiento = l.IdAsiento AND af.IdFuncion = @FuncionId
        JOIN    dbo.Asientos           AS a  ON a.Id = l.IdAsiento AND a.Activo = 1
        JOIN    dbo.Zonas              AS z  ON z.Id = a.IdZona AND z.Activo = 1
        JOIN    dbo.PreciosZonaFuncion AS p  ON p.IdFuncion = @FuncionId AND p.IdZona = a.IdZona;

        IF @@ROWCOUNT <> @Cantidad
            THROW 53003, N'Asiento que no pertenece a la función', 1;

        SELECT @IdEstadoActiva = Id FROM dbo.EstadosReserva WHERE Descripcion = N'Activa';
        SELECT @Total = SUM(Precio) FROM @Solicitados;            -- RN10

        BEGIN TRANSACTION;

        -- 7. Límite por persona y función (RN09), sólo si el servicio lo envía.
        IF @LimiteAsientos IS NOT NULL
        BEGIN
            IF @CompradorId IS NOT NULL
            BEGIN
                -- Serializa las reservas simultáneas del mismo comprador.
                SELECT @Bloqueo = Id FROM dbo.Compradores WITH (UPDLOCK, HOLDLOCK) WHERE Id = @CompradorId;

                -- Misma cuenta que SP10 (contrato: «valida el límite con SP10»).
                SELECT @Ocupados = Total
                FROM   dbo.fnReservas_ContarAsientosComprador(@CompradorId, @FuncionId, @Ahora);
            END
            ELSE
                SET @Ocupados = 0;

            IF @Ocupados + @Cantidad > @LimiteAsientos
                THROW 53001, N'Supera el máximo de asientos por persona y función', 1;
        END

        -- 8. Reserva activa (RN11).
        INSERT INTO dbo.Reservas (IdComprador, IdSitio, IdFuncion, IdEstadoReserva, CreadaEn, ExpiraEn, Total)
        OUTPUT inserted.Id INTO @Nueva (Id)
        VALUES (@CompradorId, @IdSitio, @FuncionId, @IdEstadoActiva, @Ahora, @ExpiraEn, @Total);

        SELECT @IdReserva = Id FROM @Nueva;

        -- 9. Apartado condicionado (ADR-002): sólo asientos no vendidos y sin apartado vigente.
        UPDATE af
        SET    IdReservaActual = @IdReserva,
               ExpiraEn        = @ExpiraEn
        FROM   dbo.AsientosFuncion AS af
        JOIN   @Solicitados        AS s ON s.IdAsiento = af.IdAsiento
        WHERE  af.IdFuncion = @FuncionId
          AND  af.Vendido = 0
          AND  (af.IdReservaActual IS NULL OR af.ExpiraEn <= @Ahora);

        -- 10. Todo o nada (RN08).
        IF @@ROWCOUNT <> @Cantidad
        BEGIN
            INSERT INTO @Fallidos (IdAsiento, Etiqueta, Motivo)
            SELECT  a.Id, a.Etiqueta,
                    CASE WHEN af.Vendido = 1 THEN N'Vendido' ELSE N'Apartado' END
            FROM    @Solicitados        AS s
            JOIN    dbo.AsientosFuncion AS af ON af.IdAsiento = s.IdAsiento AND af.IdFuncion = @FuncionId
            JOIN    dbo.Asientos        AS a  ON a.Id = s.IdAsiento
            WHERE   af.IdReservaActual IS NULL OR af.IdReservaActual <> @IdReserva;

            ROLLBACK TRANSACTION;

            SELECT IdAsiento, Etiqueta, Motivo FROM @Fallidos ORDER BY IdAsiento;

            SELECT @Mensaje = N'Asientos no disponibles: '
                            + STRING_AGG(CAST(IdAsiento AS NVARCHAR(12)), N',') WITHIN GROUP (ORDER BY IdAsiento)
            FROM   @Fallidos;

            THROW 51001, @Mensaje, 1;
        END

        -- 11. Asientos de la reserva con su precio (RN10).
        INSERT INTO dbo.ReservasAsientos (IdReserva, IdAsiento, PrecioTomado)
        SELECT @IdReserva, IdAsiento, Precio FROM @Solicitados;

        COMMIT TRANSACTION;

        -- Forma R.
        SELECT IdReserva, ClaveSitio, IdComprador, IdFuncion, Estado, Vencida,
               CreadaEn, ExpiraEn, Total, Moneda, IdOrden
        FROM   dbo.fnReservas_Encabezado(@IdReserva, @Ahora);

        SELECT IdReserva, IdAsiento, Etiqueta, IdZona, PrecioTomado
        FROM   dbo.fnReservas_Asientos(@IdReserva)
        ORDER BY Fila, Numero;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;

        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());

        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ============================ SP13 (tarea 4.3) ============================ */
-- Pago aprobado, atómico (garantía 2, RN15): intento aprobado, orden, un boleto
-- por asiento, reserva Pagada y asientos vendidos, en una sola transacción.
-- @UltimosDigitos: el servicio ya validó la tarjeta; sólo llegan 4 dígitos (RN31).
CREATE OR ALTER PROCEDURE dbo.spOrdenes_Pagar
    @ReservaId       UNIQUEIDENTIFIER,
    @UltimosDigitos  CHAR(4),
    @Ahora           DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Alfabeto        CHAR(32) = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ',   -- sin 0, O, 1 ni I (RN20)
            @IdReserva       BIGINT,
            @IdSitio         INT,
            @IdComprador     INT,
            @RequiereComprador BIT,
            @Bloqueo         INT,
            @IdFuncion       INT,
            @Total           DECIMAL(12,2),
            @ExpiraEn        DATETIME2(3),
            @Estado          NVARCHAR(30),
            @IdEstadoPagada  TINYINT,
            @IdAprobado      TINYINT,
            @IdIntento       BIGINT,
            @IdOrden         BIGINT,
            @Asientos        INT,
            @Libres          INT,
            @IdAsiento       INT,
            @Precio          DECIMAL(10,2),
            @Codigo          VARCHAR(12),
            @Bytes           VARBINARY(12),
            @Intento         INT,
            @Posicion        INT,
            @Mensaje         NVARCHAR(2048);

    DECLARE @PorEmitir TABLE (Orden INT IDENTITY(1,1) PRIMARY KEY, IdAsiento INT, Precio DECIMAL(10,2));
    DECLARE @Ids       TABLE (Id BIGINT);

    BEGIN TRY
        -- El servicio valida la tarjeta antes; un valor inválido aquí es un error interno (no hay código en el contrato).
        IF @UltimosDigitos IS NULL OR @UltimosDigitos LIKE '%[^0-9]%' OR LEN(@UltimosDigitos) <> 4
            THROW 50000, N'UltimosDigitos inválido recibido del servicio', 1;
        IF @Ahora IS NULL
            THROW 50000, N'@Ahora nulo recibido del servicio', 1;

        SELECT @IdEstadoPagada = Id FROM dbo.EstadosReserva WHERE Descripcion = N'Pagada';
        SELECT @IdAprobado     = Id FROM dbo.ResultadosPago WHERE Descripcion = N'Aprobado';

        BEGIN TRANSACTION;

        -- 1. Reserva bloqueada dentro de la transacción.
        SELECT  @IdReserva   = r.Id,
                @IdSitio     = r.IdSitio,
                @IdComprador = r.IdComprador,
                @IdFuncion   = r.IdFuncion,
                @Total       = r.Total,
                @ExpiraEn    = r.ExpiraEn,
                @Estado      = er.Descripcion
        FROM    dbo.Reservas       AS r WITH (UPDLOCK, HOLDLOCK)
        JOIN    dbo.EstadosReserva AS er ON er.Id = r.IdEstadoReserva
        WHERE   r.IdPublico = @ReservaId;

        IF @IdReserva IS NULL
            THROW 54003, N'Reserva no encontrada', 1;
        IF @Estado = N'Pagada'
            THROW 51003, N'La reserva ya está pagada', 1;
        IF @Estado = N'Liberada'
            THROW 52002, N'La reserva fue liberada', 1;
        IF @ExpiraEn <= @Ahora
            THROW 52001, N'La reserva venció', 1;              -- RN14

        -- Comprador según el sitio de la reserva (tarea 5.8): la orden copia el comprador (RN29).
        SELECT @RequiereComprador = RequiereComprador FROM dbo.Sitios WHERE Id = @IdSitio;
        IF @RequiereComprador = 1 AND @IdComprador IS NULL
            THROW 53005, N'El sitio requiere un comprador', 1;
        IF @RequiereComprador = 0 AND @IdComprador IS NOT NULL
            THROW 53006, N'El sitio no usa comprador', 1;

        -- Mismo candado que SP07 sobre el comprador: el límite de 10 no puede contar de menos
        -- mientras esta reserva pasa de apartada a comprada. Orden: Reservas → Compradores → AsientosFuncion.
        IF @IdComprador IS NOT NULL
            SELECT @Bloqueo = Id FROM dbo.Compradores WITH (UPDLOCK, HOLDLOCK) WHERE Id = @IdComprador;

        -- 2. Comprobación defensiva: todos sus asientos siguen apartados por ella y sin vender.
        SELECT @Asientos = COUNT(*) FROM dbo.ReservasAsientos WHERE IdReserva = @IdReserva;

        SELECT @Libres = COUNT(*)
        FROM   dbo.ReservasAsientos AS ra
        JOIN   dbo.AsientosFuncion  AS af WITH (UPDLOCK)
               ON af.IdAsiento = ra.IdAsiento AND af.IdFuncion = @IdFuncion
        WHERE  ra.IdReserva = @IdReserva
          AND  af.IdReservaActual = @IdReserva AND af.Vendido = 0;

        IF @Libres <> @Asientos
        BEGIN
            SELECT @Mensaje = N'Asientos no disponibles: '
                            + STRING_AGG(CAST(ra.IdAsiento AS NVARCHAR(12)), N',') WITHIN GROUP (ORDER BY ra.IdAsiento)
            FROM   dbo.ReservasAsientos AS ra
            JOIN   dbo.AsientosFuncion  AS af ON af.IdAsiento = ra.IdAsiento AND af.IdFuncion = @IdFuncion
            WHERE  ra.IdReserva = @IdReserva
              AND  (af.IdReservaActual IS NULL OR af.IdReservaActual <> @IdReserva OR af.Vendido = 1);

            THROW 51001, @Mensaje, 1;
        END

        -- 3. Intento aprobado.
        INSERT INTO dbo.IntentosPago (IdReserva, IdResultadoPago, UltimosDigitos, FechaIntento)
        OUTPUT inserted.Id INTO @Ids (Id)
        VALUES (@IdReserva, @IdAprobado, @UltimosDigitos, @Ahora);
        SELECT @IdIntento = Id FROM @Ids;
        DELETE FROM @Ids;

        -- 4. Orden; el Folio se calcula solo (RN19). Copia el comprador aunque sea nulo (RN29).
        INSERT INTO dbo.Ordenes (IdReserva, IdComprador, IdSitio, Total, FechaCompra)
        OUTPUT inserted.Id INTO @Ids (Id)
        VALUES (@IdReserva, @IdComprador, @IdSitio, @Total, @Ahora);
        SELECT @IdOrden = Id FROM @Ids;

        -- 5. Un boleto por asiento con código aleatorio de 12 caracteres (RN20), máximo 10 vueltas.
        INSERT INTO @PorEmitir (IdAsiento, Precio)
        SELECT ra.IdAsiento, ra.PrecioTomado
        FROM   dbo.ReservasAsientos AS ra
        JOIN   dbo.Asientos         AS a ON a.Id = ra.IdAsiento
        WHERE  ra.IdReserva = @IdReserva
        ORDER BY a.Fila, a.Numero;

        DECLARE @Vuelta INT = 1, @Vueltas INT = (SELECT COUNT(*) FROM @PorEmitir);
        WHILE @Vuelta <= @Vueltas
        BEGIN
            SELECT @IdAsiento = IdAsiento, @Precio = Precio FROM @PorEmitir WHERE Orden = @Vuelta;

            SET @Intento = 0;
            SET @Codigo  = NULL;
            WHILE @Codigo IS NULL AND @Intento < 5
            BEGIN
                SET @Intento  = @Intento + 1;
                SET @Bytes    = CRYPT_GEN_RANDOM(12);
                SET @Codigo   = '';
                SET @Posicion = 1;
                -- 256 es múltiplo de 32: cada símbolo tiene la misma probabilidad.
                WHILE @Posicion <= 12
                BEGIN
                    SET @Codigo = @Codigo
                                + SUBSTRING(@Alfabeto, (CAST(SUBSTRING(@Bytes, @Posicion, 1) AS INT) % 32) + 1, 1);
                    SET @Posicion = @Posicion + 1;
                END
                IF EXISTS (SELECT 1 FROM dbo.Boletos WHERE Codigo = @Codigo)
                    SET @Codigo = NULL;
            END

            IF @Codigo IS NULL
                THROW 50000, N'No se pudo generar un código de boleto único', 1;

            INSERT INTO dbo.Boletos (IdOrden, IdFuncion, IdAsiento, Precio, Codigo)
            VALUES (@IdOrden, @IdFuncion, @IdAsiento, @Precio, @Codigo);

            SET @Vuelta = @Vuelta + 1;
        END

        -- 6. Reserva pagada y asientos vendidos; IdReservaActual se conserva (RN15).
        UPDATE dbo.Reservas SET IdEstadoReserva = @IdEstadoPagada WHERE Id = @IdReserva;

        -- Sólo toca las filas ya bloqueadas en el paso 2 (por la clave IdFuncion, IdAsiento),
        -- para no pedir bloqueos sobre otros asientos de la función (evita deadlock con SP07).
        UPDATE af
        SET    af.Vendido = 1, af.ExpiraEn = NULL
        FROM   dbo.AsientosFuncion  AS af
        JOIN   dbo.ReservasAsientos AS ra ON ra.IdAsiento = af.IdAsiento
        WHERE  ra.IdReserva = @IdReserva AND af.IdFuncion = @IdFuncion
          AND  af.IdReservaActual = @IdReserva;

        IF @@ROWCOUNT <> @Asientos
            THROW 50000, N'Asientos de la reserva inconsistentes', 1;   -- el CATCH lo registra

        COMMIT TRANSACTION;

        -- Resultado 1: el intento aprobado.
        SELECT  @IdIntento       AS IdIntento,
                @ReservaId       AS IdReserva,
                N'Aprobado'      AS Resultado,
                @Ahora           AS FechaIntento,
                @UltimosDigitos  AS UltimosDigitos;

        -- Resultados 2 y 3: forma O.
        SELECT IdOrden, Folio, IdReserva, ClaveSitio, IdComprador, FechaCompra, Total, Moneda, UltimosDigitos
        FROM   dbo.fnOrdenes_Encabezado(@IdOrden);

        SELECT IdOrden, IdBoleto, Codigo, IdEvento, NombreEvento, IdFuncion, FechaHoraInicio,
               IdZona, Zona, IdAsiento, Etiqueta, Precio
        FROM   dbo.fnOrdenes_Boletos(@IdOrden)
        ORDER BY IdBoleto;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;

        -- Segunda defensa contra doble venta (RN18) y contra dos órdenes de una reserva (RN17).
        IF ERROR_NUMBER() IN (2601, 2627) AND ERROR_MESSAGE() LIKE N'%UQ_Boletos_IdFuncion_IdAsiento%'
        BEGIN
            -- Mismo formato fijo que SP07 (D11), con los asientos de la reserva.
            SELECT @Mensaje = N'Asientos no disponibles: '
                            + STRING_AGG(CAST(IdAsiento AS NVARCHAR(12)), N',') WITHIN GROUP (ORDER BY IdAsiento)
            FROM   dbo.ReservasAsientos
            WHERE  IdReserva = @IdReserva;

            THROW 51001, @Mensaje, 1;
        END
        IF ERROR_NUMBER() IN (2601, 2627) AND ERROR_MESSAGE() LIKE N'%UQ_Ordenes_IdReserva%'
            THROW 51003, N'La reserva ya está pagada', 1;

        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());

        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ======================= SP01 a SP05 (tarea 5.1) ======================= */

-- SP01. Alta de comprador (sólo sitios con RequiereComprador = 1). Nunca devuelve el hash (RN22).
CREATE OR ALTER PROCEDURE dbo.spCompradores_Registrar
    @Sitio           VARCHAR(20),
    @Nombre          NVARCHAR(150),
    @Correo          NVARCHAR(254),     -- ya en minúsculas y sin espacios (RN21)
    @HashContrasena  VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @RequiereComprador BIT;
    DECLARE @Nuevo TABLE (Id INT);

    BEGIN TRY
        SELECT @RequiereComprador = RequiereComprador FROM dbo.Sitios WHERE Clave = @Sitio AND Activo = 1;
        IF @RequiereComprador IS NULL
            THROW 53007, N'Sitio no válido', 1;
        IF @RequiereComprador = 0
            THROW 53006, N'El sitio no usa comprador', 1;      -- tarea 5.8

        IF NULLIF(LTRIM(RTRIM(@Nombre)), N'') IS NULL
           OR NULLIF(LTRIM(RTRIM(@Correo)), N'') IS NULL
           OR NULLIF(LTRIM(RTRIM(@HashContrasena)), '') IS NULL
            THROW 53008, N'Datos del comprador incompletos', 1;

        IF EXISTS (SELECT 1 FROM dbo.Compradores WHERE Correo = @Correo)
            THROW 51002, N'El correo ya está registrado', 1;

        INSERT INTO dbo.Compradores (Nombre, Correo, HashContrasena)
        OUTPUT inserted.Id INTO @Nuevo (Id)
        VALUES (LTRIM(RTRIM(@Nombre)), @Correo, @HashContrasena);

        SELECT c.Id, c.Nombre, c.Correo                     -- nombres del contrato (→ Id)
        FROM   dbo.Compradores AS c
        JOIN   @Nuevo          AS n ON n.Id = c.Id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        -- Dos registros simultáneos con el mismo correo (UQ_Compradores_Correo).
        IF ERROR_NUMBER() IN (2601, 2627)
            THROW 51002, N'El correo ya está registrado', 1;

        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP02. Comprador activo por correo, con su hash, para el inicio de sesión.
-- Sin renglones si no existe: el servicio no revela si el correo existe.
CREATE OR ALTER PROCEDURE dbo.spCompradores_ObtenerPorCorreo
    @Correo  NVARCHAR(254)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        SELECT Id, Nombre, Correo, HashContrasena           -- nombres del contrato (→ Id y HashContrasena)
        FROM   dbo.Compradores
        WHERE  Correo = @Correo AND Activo = 1;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP03. Eventos activos del sitio. Recinto = Sitios.Descripcion (H6).
CREATE OR ALTER PROCEDURE dbo.spEventos_Listar
    @Sitio  VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Sitios WHERE Clave = @Sitio AND Activo = 1)
            THROW 53007, N'Sitio no válido', 1;

        SELECT  e.Id          AS IdEvento,
                s.Clave       AS ClaveSitio,
                e.Nombre,
                e.Descripcion,
                s.Descripcion AS Recinto
        FROM    dbo.Eventos AS e
        JOIN    dbo.Sitios  AS s ON s.Id = e.IdSitio
        WHERE   s.Clave = @Sitio AND e.Activo = 1
        ORDER BY e.Nombre, e.Id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP04. Funciones activas de un evento (con ClaveSitio para que el servicio verifique el sitio)
-- y, en un segundo conjunto, las zonas con precio de cada función (forma Función del contrato).
CREATE OR ALTER PROCEDURE dbo.spFunciones_ListarPorEvento
    @EventoId  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Eventos WHERE Id = @EventoId AND Activo = 1)
            THROW 54002, N'Evento no encontrado', 1;

        SELECT  f.Id              AS IdFuncion,
                f.IdEvento,
                s.Clave           AS ClaveSitio,
                f.FechaHoraInicio,                       -- UTC
                f.Formato,
                f.Idioma,
                f.Clasificacion,
                f.DuracionMinutos,
                f.IdZona,
                z.Descripcion     AS Sala                -- NULL en web_1
        FROM    dbo.Funciones AS f
        JOIN    dbo.Eventos   AS e ON e.Id = f.IdEvento
        JOIN    dbo.Sitios    AS s ON s.Id = e.IdSitio
        LEFT JOIN dbo.Zonas   AS z ON z.Id = f.IdZona
        WHERE   f.IdEvento = @EventoId AND f.Activo = 1
        ORDER BY f.FechaHoraInicio, f.IdZona, f.Id;

        SELECT  p.IdFuncion,
                z.Id           AS IdZona,
                z.Descripcion  AS Zona,
                p.Precio,
                p.Moneda
        FROM    dbo.Funciones          AS f
        JOIN    dbo.PreciosZonaFuncion AS p ON p.IdFuncion = f.Id
        JOIN    dbo.Zonas              AS z ON z.Id = p.IdZona
        WHERE   f.IdEvento = @EventoId AND f.Activo = 1 AND z.Activo = 1
        ORDER BY p.IdFuncion, p.Precio DESC, z.Id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP05. Una función con formato, idioma, clasificación y duración, y sus zonas con precio.
CREATE OR ALTER PROCEDURE dbo.spFunciones_Obtener
    @FuncionId  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1
                       FROM   dbo.Funciones AS f
                       JOIN   dbo.Eventos   AS e ON e.Id = f.IdEvento
                       WHERE  f.Id = @FuncionId AND f.Activo = 1 AND e.Activo = 1)
            THROW 54001, N'Función no encontrada', 1;

        SELECT  f.Id              AS IdFuncion,
                f.IdEvento,
                e.Nombre          AS NombreEvento,
                s.Clave           AS ClaveSitio,
                f.FechaHoraInicio,
                f.Formato,
                f.Idioma,
                f.Clasificacion,
                f.DuracionMinutos,
                f.IdZona,
                z.Descripcion     AS Sala
        FROM    dbo.Funciones AS f
        JOIN    dbo.Eventos   AS e ON e.Id = f.IdEvento
        JOIN    dbo.Sitios    AS s ON s.Id = e.IdSitio
        LEFT JOIN dbo.Zonas   AS z ON z.Id = f.IdZona
        WHERE   f.Id = @FuncionId;

        SELECT  z.Id           AS IdZona,
                z.Descripcion  AS Zona,
                p.Precio,
                p.Moneda
        FROM    dbo.PreciosZonaFuncion AS p
        JOIN    dbo.Zonas              AS z ON z.Id = p.IdZona
        WHERE   p.IdFuncion = @FuncionId AND z.Activo = 1
        ORDER BY p.Precio DESC, z.Id;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ======================= SP08 a SP11 (tarea 5.2) ======================= */

-- SP08. Una reserva del sitio (forma R). Otra reserva de otro sitio responde igual que una inexistente.
CREATE OR ALTER PROCEDURE dbo.spReservas_Obtener
    @ReservaId  UNIQUEIDENTIFIER,
    @Sitio      VARCHAR(20),
    @Ahora      DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdReserva BIGINT;

    BEGIN TRY
        IF @Ahora IS NULL
            THROW 50000, N'@Ahora nulo recibido del servicio', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.Sitios WHERE Clave = @Sitio AND Activo = 1)
            THROW 53007, N'Sitio no válido', 1;

        SELECT @IdReserva = r.Id
        FROM   dbo.Reservas AS r
        JOIN   dbo.Sitios   AS s ON s.Id = r.IdSitio
        WHERE  r.IdPublico = @ReservaId AND s.Clave = @Sitio;

        IF @IdReserva IS NULL
            THROW 54003, N'Reserva no encontrada', 1;

        SELECT IdReserva, ClaveSitio, IdComprador, IdFuncion, Estado, Vencida,
               CreadaEn, ExpiraEn, Total, Moneda, IdOrden
        FROM   dbo.fnReservas_Encabezado(@IdReserva, @Ahora);

        SELECT IdReserva, IdAsiento, Etiqueta, IdZona, PrecioTomado
        FROM   dbo.fnReservas_Asientos(@IdReserva)
        ORDER BY Fila, Numero;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP09. Reservas activas y vigentes del comprador (forma R), de la más antigua a la más reciente.
CREATE OR ALTER PROCEDURE dbo.spReservas_ListarActivasPorComprador
    @CompradorId  INT,
    @Ahora        DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Ids TABLE (Id BIGINT PRIMARY KEY, CreadaEn DATETIME2(3));

    BEGIN TRY
        IF @Ahora IS NULL
            THROW 50000, N'@Ahora nulo recibido del servicio', 1;

        INSERT INTO @Ids (Id, CreadaEn)
        SELECT r.Id, r.CreadaEn
        FROM   dbo.Reservas       AS r
        JOIN   dbo.EstadosReserva AS er ON er.Id = r.IdEstadoReserva
        WHERE  r.IdComprador = @CompradorId AND er.Descripcion = N'Activa' AND r.ExpiraEn > @Ahora;

        SELECT h.IdReserva, h.ClaveSitio, h.IdComprador, h.IdFuncion, h.Estado, h.Vencida,
               h.CreadaEn, h.ExpiraEn, h.Total, h.Moneda, h.IdOrden
        FROM   @Ids AS i
        CROSS APPLY dbo.fnReservas_Encabezado(i.Id, @Ahora) AS h
        ORDER BY i.CreadaEn, i.Id;

        SELECT a.IdReserva, a.IdAsiento, a.Etiqueta, a.IdZona, a.PrecioTomado
        FROM   @Ids AS i
        CROSS APPLY dbo.fnReservas_Asientos(i.Id) AS a
        ORDER BY i.CreadaEn, i.Id, a.Fila, a.Numero;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP10. Asientos del comprador en la función: apartados vigentes + comprados (misma cuenta que SP07).
CREATE OR ALTER PROCEDURE dbo.spReservas_ContarAsientosCompradorFuncion
    @CompradorId  INT,
    @FuncionId    INT,
    @Ahora        DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF @Ahora IS NULL
            THROW 50000, N'@Ahora nulo recibido del servicio', 1;

        SELECT Apartados, Comprados, Total
        FROM   dbo.fnReservas_ContarAsientosComprador(@CompradorId, @FuncionId, @Ahora);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP11. Libera una reserva activa y vigente. Contrato «Liberar reserva»: vencida → 52001 y NO se
-- libera; pagada → 51003; ya liberada → 52002; inexistente o de otro sitio → 54003.
CREATE OR ALTER PROCEDURE dbo.spReservas_Liberar
    @ReservaId  UNIQUEIDENTIFIER,
    @Sitio      VARCHAR(20),
    @Ahora      DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdReserva BIGINT, @IdFuncion INT, @ExpiraEn DATETIME2(3), @Estado NVARCHAR(30),
            @IdEstadoLiberada TINYINT;

    BEGIN TRY
        IF @Ahora IS NULL
            THROW 50000, N'@Ahora nulo recibido del servicio', 1;

        IF NOT EXISTS (SELECT 1 FROM dbo.Sitios WHERE Clave = @Sitio AND Activo = 1)
            THROW 53007, N'Sitio no válido', 1;

        SELECT @IdEstadoLiberada = Id FROM dbo.EstadosReserva WHERE Descripcion = N'Liberada';

        BEGIN TRANSACTION;

        SELECT  @IdReserva = r.Id, @IdFuncion = r.IdFuncion, @ExpiraEn = r.ExpiraEn, @Estado = er.Descripcion
        FROM    dbo.Reservas       AS r WITH (UPDLOCK)
        JOIN    dbo.EstadosReserva AS er ON er.Id = r.IdEstadoReserva
        JOIN    dbo.Sitios         AS s  ON s.Id = r.IdSitio
        WHERE   r.IdPublico = @ReservaId AND s.Clave = @Sitio;

        IF @IdReserva IS NULL
            THROW 54003, N'Reserva no encontrada', 1;
        IF @Estado = N'Pagada'
            THROW 51003, N'La reserva ya está pagada', 1;
        IF @Estado = N'Liberada'
            THROW 52002, N'La reserva fue liberada', 1;
        IF @ExpiraEn <= @Ahora
            THROW 52001, N'La reserva venció', 1;

        UPDATE dbo.Reservas SET IdEstadoReserva = @IdEstadoLiberada WHERE Id = @IdReserva;

        -- Sólo las filas de sus asientos (RN12).
        UPDATE af
        SET    af.IdReservaActual = NULL, af.ExpiraEn = NULL
        FROM   dbo.AsientosFuncion  AS af
        JOIN   dbo.ReservasAsientos AS ra ON ra.IdAsiento = af.IdAsiento
        WHERE  ra.IdReserva = @IdReserva AND af.IdFuncion = @IdFuncion
          AND  af.IdReservaActual = @IdReserva AND af.Vendido = 0;

        COMMIT TRANSACTION;

        SELECT IdReserva, ClaveSitio, IdComprador, IdFuncion, Estado, Vencida,
               CreadaEn, ExpiraEn, Total, Moneda, IdOrden
        FROM   dbo.fnReservas_Encabezado(@IdReserva, @Ahora);

        SELECT IdReserva, IdAsiento, Etiqueta, IdZona, PrecioTomado
        FROM   dbo.fnReservas_Asientos(@IdReserva)
        ORDER BY Fila, Numero;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ============================ SP12 (tarea 5.3) ============================ */
-- Registra un intento de pago rechazado. La reserva sigue Activa y su ExpiraEn no cambia (RN16).
CREATE OR ALTER PROCEDURE dbo.spIntentosPago_Registrar
    @ReservaId       UNIQUEIDENTIFIER,
    @Resultado       VARCHAR(10),       -- sólo 'rechazado' (el aprobado lo registra SP13)
    @UltimosDigitos  CHAR(4),
    @Ahora           DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdReserva BIGINT, @ExpiraEn DATETIME2(3), @Estado NVARCHAR(30), @IdRechazado TINYINT;
    DECLARE @Ids TABLE (Id BIGINT);

    BEGIN TRY
        -- Valores que el servicio ya validó: si llegan mal es un error interno (el contrato no tiene código).
        IF @Resultado IS NULL OR @Resultado <> 'rechazado'
            THROW 50000, N'@Resultado distinto de rechazado recibido del servicio', 1;
        IF @UltimosDigitos IS NULL OR @UltimosDigitos LIKE '%[^0-9]%' OR LEN(@UltimosDigitos) <> 4
            THROW 50000, N'UltimosDigitos inválido recibido del servicio', 1;
        IF @Ahora IS NULL
            THROW 50000, N'@Ahora nulo recibido del servicio', 1;

        SELECT @IdRechazado = Id FROM dbo.ResultadosPago WHERE Descripcion = N'Rechazado';

        -- Transacción corta: el UPDLOCK la pone en fila con un SP13 simultáneo de la misma reserva.
        BEGIN TRANSACTION;

        SELECT  @IdReserva = r.Id, @ExpiraEn = r.ExpiraEn, @Estado = er.Descripcion
        FROM    dbo.Reservas       AS r WITH (UPDLOCK)
        JOIN    dbo.EstadosReserva AS er ON er.Id = r.IdEstadoReserva
        WHERE   r.IdPublico = @ReservaId;

        IF @IdReserva IS NULL
            THROW 54003, N'Reserva no encontrada', 1;
        IF @Estado = N'Pagada'
            THROW 51003, N'La reserva ya está pagada', 1;
        IF @Estado = N'Liberada'
            THROW 52002, N'La reserva fue liberada', 1;
        IF @ExpiraEn <= @Ahora
            THROW 52001, N'La reserva venció', 1;

        INSERT INTO dbo.IntentosPago (IdReserva, IdResultadoPago, UltimosDigitos, FechaIntento)
        OUTPUT inserted.Id INTO @Ids (Id)
        VALUES (@IdReserva, @IdRechazado, @UltimosDigitos, @Ahora);

        COMMIT TRANSACTION;

        SELECT  i.Id             AS IdIntento,
                @ReservaId       AS IdReserva,
                N'Rechazado'     AS Resultado,
                @Ahora           AS FechaIntento,
                @UltimosDigitos  AS UltimosDigitos
        FROM    @Ids AS i;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ======================= SP14 y SP15 (tarea 5.4) ======================= */

-- SP14. Una orden del sitio (forma O). Otra de otro sitio responde igual que una inexistente.
CREATE OR ALTER PROCEDURE dbo.spOrdenes_Obtener
    @OrdenId  BIGINT,
    @Sitio    VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Sitios WHERE Clave = @Sitio AND Activo = 1)
            THROW 53007, N'Sitio no válido', 1;

        IF NOT EXISTS (SELECT 1
                       FROM   dbo.Ordenes AS o
                       JOIN   dbo.Sitios  AS s ON s.Id = o.IdSitio
                       WHERE  o.Id = @OrdenId AND s.Clave = @Sitio)
            THROW 54004, N'Orden no encontrada', 1;

        SELECT IdOrden, Folio, IdReserva, ClaveSitio, IdComprador, FechaCompra, Total, Moneda, UltimosDigitos
        FROM   dbo.fnOrdenes_Encabezado(@OrdenId);

        SELECT IdOrden, IdBoleto, Codigo, IdEvento, NombreEvento, IdFuncion, FechaHoraInicio,
               IdZona, Zona, IdAsiento, Etiqueta, Precio
        FROM   dbo.fnOrdenes_Boletos(@OrdenId)
        ORDER BY IdBoleto;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP15. Órdenes del comprador (forma O), de la más antigua a la más reciente.
CREATE OR ALTER PROCEDURE dbo.spOrdenes_ListarPorComprador
    @CompradorId  INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        -- Sólo los sitios con cuenta tienen órdenes por comprador (tarea 5.8).
        IF @CompradorId IS NULL
            THROW 53005, N'El sitio requiere un comprador', 1;

        SELECT h.IdOrden, h.Folio, h.IdReserva, h.ClaveSitio, h.IdComprador, h.FechaCompra,
               h.Total, h.Moneda, h.UltimosDigitos
        FROM   dbo.Ordenes AS o
        CROSS APPLY dbo.fnOrdenes_Encabezado(o.Id) AS h
        WHERE  o.IdComprador = @CompradorId
        ORDER BY o.FechaCompra, o.Id;

        SELECT b.IdOrden, b.IdBoleto, b.Codigo, b.IdEvento, b.NombreEvento, b.IdFuncion, b.FechaHoraInicio,
               b.IdZona, b.Zona, b.IdAsiento, b.Etiqueta, b.Precio
        FROM   dbo.Ordenes AS o
        CROSS APPLY dbo.fnOrdenes_Boletos(o.Id) AS b
        WHERE  o.IdComprador = @CompradorId
        ORDER BY o.FechaCompra, o.Id, b.IdBoleto;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ======================= SP16 y SP17 (tarea 5.5) ======================= */

-- SP16. Consolidación de boletos del sitio entre dos días locales de CDMX (incluidos), por FechaCompra.
-- Comprador nulo en compras sin cuenta (web_2). No devuelve correos ni hashes.
CREATE OR ALTER PROCEDURE dbo.spBoletos_Consolidar
    @Sitio  VARCHAR(20),
    @Desde  DATE,
    @Hasta  DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdSitio INT, @InicioUtc DATETIME2(3), @FinUtc DATETIME2(3);

    BEGIN TRY
        SELECT @IdSitio = Id FROM dbo.Sitios WHERE Clave = @Sitio AND Activo = 1;
        IF @IdSitio IS NULL
            THROW 53007, N'Sitio no válido', 1;
        IF @Desde IS NULL OR @Hasta IS NULL OR @Desde > @Hasta OR DATEDIFF(DAY, @Desde, @Hasta) > 366
            THROW 53002, N'Rango de fechas inválido', 1;

        -- Día local CDMX = UTC−6 fijo (ADR-003).
        SET @InicioUtc = DATEADD(HOUR, 6, CAST(@Desde AS DATETIME2(3)));
        SET @FinUtc    = DATEADD(HOUR, 6, CAST(DATEADD(DAY, 1, @Hasta) AS DATETIME2(3)));

        SELECT  b.IdOrden, b.IdBoleto, b.Codigo, b.IdEvento, b.NombreEvento, b.IdFuncion, b.FechaHoraInicio,
                b.IdZona, b.Zona, b.IdAsiento, b.Etiqueta, b.Precio,
                o.Folio,
                s.Clave         AS ClaveSitio,
                o.IdComprador,
                c.Nombre        AS NombreComprador,
                o.FechaCompra
        FROM    dbo.Ordenes AS o
        CROSS APPLY dbo.fnOrdenes_Boletos(o.Id) AS b
        JOIN    dbo.Sitios      AS s ON s.Id = o.IdSitio
        LEFT JOIN dbo.Compradores AS c ON c.Id = o.IdComprador
        WHERE   o.IdSitio = @IdSitio AND o.FechaCompra >= @InicioUtc AND o.FechaCompra < @FinUtc
        ORDER BY o.FechaCompra, b.IdBoleto;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

-- SP17 (opcional). Limpieza: quita el apartado de los asientos cuyas reservas Activa ya vencieron.
-- No cambia el estado de la reserva: el contrato exige que una reserva vencida se siga viendo
-- vencida (no liberada). Sus asientos ya se consideraban disponibles (RN02).
CREATE OR ALTER PROCEDURE dbo.spReservas_LimpiarVencidas
    @Ahora  DATETIME2(3)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Limpiados INT = 0, @Lote INT = 1;

    BEGIN TRY
        IF @Ahora IS NULL
            THROW 50000, N'@Ahora nulo recibido del servicio', 1;

        -- Limpieza de baja prioridad: lotes cortos que saltan filas bloqueadas, para no frenar
        -- ni bloquear (deadlock) a SP07 y SP13. Lo que se salte se limpia en la siguiente ejecución.
        SET DEADLOCK_PRIORITY LOW;

        WHILE @Lote > 0
        BEGIN
            BEGIN TRANSACTION;

            UPDATE TOP (500) af
            SET    af.IdReservaActual = NULL, af.ExpiraEn = NULL
            FROM   dbo.AsientosFuncion AS af WITH (READPAST)
            JOIN   dbo.Reservas        AS r  WITH (READPAST) ON r.Id = af.IdReservaActual
            JOIN   dbo.EstadosReserva  AS er ON er.Id = r.IdEstadoReserva
            WHERE  af.Vendido = 0 AND er.Descripcion = N'Activa' AND r.ExpiraEn <= @Ahora;

            SET @Lote = @@ROWCOUNT;
            SET @Limpiados = @Limpiados + @Lote;

            COMMIT TRANSACTION;
        END

        SELECT @Limpiados AS AsientosLimpiados;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ============================ SP18 (tarea 5.6) ============================ */
-- Recuperar una compra sin cuenta por folio o por código de boleto (P17). Reemplaza a
-- spOrdenes_ObtenerPorCodigo. Exactamente uno de los dos; otro sitio responde igual que inexistente.
IF OBJECT_ID(N'dbo.spOrdenes_ObtenerPorCodigo', N'P') IS NOT NULL
    DROP PROCEDURE dbo.spOrdenes_ObtenerPorCodigo;
GO

CREATE OR ALTER PROCEDURE dbo.spOrdenes_Buscar
    @Sitio   VARCHAR(20),
    @Folio   VARCHAR(30) = NULL,
    @Codigo  VARCHAR(12) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdOrden BIGINT;

    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.Sitios WHERE Clave = @Sitio AND Activo = 1)
            THROW 53007, N'Sitio no válido', 1;

        SET @Folio  = NULLIF(LTRIM(RTRIM(@Folio)), '');
        SET @Codigo = NULLIF(LTRIM(RTRIM(@Codigo)), '');

        IF (@Folio IS NULL AND @Codigo IS NULL) OR (@Folio IS NOT NULL AND @Codigo IS NOT NULL)
            THROW 53002, N'Búsqueda inválida: envíe folio o código', 1;

        IF @Folio IS NOT NULL
            SELECT @IdOrden = o.Id
            FROM   dbo.Ordenes AS o
            JOIN   dbo.Sitios  AS s ON s.Id = o.IdSitio
            WHERE  o.Folio = @Folio AND s.Clave = @Sitio;
        ELSE
            SELECT @IdOrden = o.Id
            FROM   dbo.Boletos AS b
            JOIN   dbo.Ordenes AS o ON o.Id = b.IdOrden
            JOIN   dbo.Sitios  AS s ON s.Id = o.IdSitio
            WHERE  b.Codigo = @Codigo AND s.Clave = @Sitio;

        IF @IdOrden IS NULL
            THROW 54004, N'Orden no encontrada', 1;

        SELECT IdOrden, Folio, IdReserva, ClaveSitio, IdComprador, FechaCompra, Total, Moneda, UltimosDigitos
        FROM   dbo.fnOrdenes_Encabezado(@IdOrden);

        SELECT IdOrden, IdBoleto, Codigo, IdEvento, NombreEvento, IdFuncion, FechaHoraInicio,
               IdZona, Zona, IdAsiento, Etiqueta, Precio
        FROM   dbo.fnOrdenes_Boletos(@IdOrden)
        ORDER BY IdBoleto;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ============================ SP19 (tarea 5.7) ============================ */
-- Conteo de reservas creadas por día local de CDMX (UTC−6 fijo, design §6), sin importar el estado
-- final (RN06 de web_2). Los días sin reservas no aparecen.
CREATE OR ALTER PROCEDURE dbo.spReservas_ContarPorDia
    @Sitio  VARCHAR(20),
    @Desde  DATE,
    @Hasta  DATE
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @IdSitio INT, @InicioUtc DATETIME2(3), @FinUtc DATETIME2(3);

    BEGIN TRY
        SELECT @IdSitio = Id FROM dbo.Sitios WHERE Clave = @Sitio AND Activo = 1;
        IF @IdSitio IS NULL
            THROW 53007, N'Sitio no válido', 1;
        IF @Desde IS NULL OR @Hasta IS NULL OR @Desde > @Hasta OR DATEDIFF(DAY, @Desde, @Hasta) > 366
            THROW 53002, N'Rango de fechas inválido', 1;

        SET @InicioUtc = DATEADD(HOUR, 6, CAST(@Desde AS DATETIME2(3)));
        SET @FinUtc    = DATEADD(HOUR, 6, CAST(DATEADD(DAY, 1, @Hasta) AS DATETIME2(3)));

        SELECT  CAST(DATEADD(HOUR, -6, r.CreadaEn) AS DATE)                 AS Fecha,
                COUNT(*)                                                    AS ReservasCreadas,
                SUM(CASE WHEN er.Descripcion = N'Pagada' THEN 1 ELSE 0 END) AS ReservasPagadas
        FROM    dbo.Reservas       AS r
        JOIN    dbo.EstadosReserva AS er ON er.Id = r.IdEstadoReserva
        WHERE   r.IdSitio = @IdSitio AND r.CreadaEn >= @InicioUtc AND r.CreadaEn < @FinUtc
        GROUP BY CAST(DATEADD(HOUR, -6, r.CreadaEn) AS DATE)
        ORDER BY Fecha;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() BETWEEN 51000 AND 54999
            THROW;
        INSERT INTO dbo.BitacoraErrores (Procedimiento, NumeroError, Severidad, Estado, Linea, Mensaje)
        VALUES (ERROR_PROCEDURE(), ERROR_NUMBER(), ERROR_SEVERITY(), ERROR_STATE(), ERROR_LINE(), ERROR_MESSAGE());
        THROW 50000, N'Error interno', 1;
    END CATCH
END;
GO

/* ============================== Permisos ============================== */
-- El servicio sólo ejecuta procedimientos; no tiene permiso sobre tablas (RNF-B07).
GRANT EXECUTE ON SCHEMA::dbo TO rolCitasServicio;
GO

-- =============================================================
-- PRUEBAS / VERIFICACIÓN
-- =============================================================
-- Esperado: 19 procedimientos y 5 funciones internas (no existe spOrdenes_ObtenerPorCodigo).
SELECT type_desc AS Tipo, COUNT(*) AS Cantidad
FROM   sys.objects
WHERE  schema_id = SCHEMA_ID(N'dbo') AND type IN ('P', 'IF')
GROUP BY type_desc;
GO
