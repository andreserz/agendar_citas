/* =============================================================
   05_datos_iniciales.sql — Datos iniciales de CitasBD
   -------------------------------------------------------------
   Proyecto : citas_backend (change impl-backend, tareas 6.1 a 6.3)
   Ejecutar : después de 04_sps.sql.
   Fuentes  : contrato-entre-capas, Requirement «Semilla de datos
              acordada» (manda sobre BCK_ESPECIFICACION §8.3);
              backend-esquema-contrato, Requirement «Semilla de web_1
              y web_2»; BCK_ESPECIFICACION §8.1 y §8.2.

   Carga:
     Catálogos : EstadosReserva (1 Activa, 2 Liberada, 3 Pagada) y
                 ResultadosPago (1 Aprobado, 2 Rechazado).
     web_1     : 1 evento, 3 zonas, 120 asientos, 120 funciones
                 (jue, vie y sáb del 1 oct al 31 dic 2026, 15:00,
                 19:00 y 21:00 CDMX), 360 precios, 14,400 asientos
                 por función.
     web_2     : 1 evento, 10 salas de 80, 800 asientos, 900 funciones
                 (19 nov al 18 dic 2026; salas 1–5 2D a las 13:00,
                 16:00 y 20:00; salas 6–10 3D a las 12:30, 15:30 y
                 18:30 CDMX), 900 precios (uno por función, el de su
                 sala, RN30) y 72,000 asientos por función.

   Reglas (§8.1):
     - Idempotente: cada INSERT usa NOT EXISTS sobre la clave única.
     - Una sola transacción con XACT_ABORT y TRY/CATCH.
     - Día de la semana sin depender de DATEFIRST:
       DATEDIFF(DAY, '20000103', Fecha) % 7 (0 = lunes ... 6 = domingo).
     - Hora local CDMX → UTC: + 6 horas fijas (ADR-003).
     - Días generados con una tabla de números (sin ciclos).
     - Bloque de verificación antes del COMMIT: si un conteo de la
       semilla no cuadra, se deshace todo.

   Operación:
     - El archivo va en UTF-8 con BOM; sin BOM, sqlcmd guarda mal los
       acentos («Balcón», «Aquí», «¡»).
     - Correr en ventana de mantenimiento si la base ya tiene uso: la
       carga de ~87,000 filas de AsientosFuncion escala a bloqueo de
       tabla hasta el COMMIT y SP07/SP13 esperan.
     - Sólo inserta lo que falta; nunca actualiza. Un valor viejo que
       no cuadre (p. ej. una sala con Capacidad distinta de 80) hace
       fallar la verificación y se corrige a mano.
   ============================================================= */
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;   -- requerido por columnas calculadas PERSISTED e índices filtrados
SET XACT_ABORT ON;
GO

USE CitasBD;
GO

-- Tablas de trabajo temporales (no variables de tabla): tienen estadísticas
-- y el optimizador elige mejores planes para los INSERT grandes.
DROP TABLE IF EXISTS #Numeros, #ZonasWeb1, #FuncionesWeb1, #Salas, #Horarios, #FuncionesWeb2;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @DesfaseUtcMinutos INT = 360;   -- CDMX = UTC−6 todo el año (ADR-003)

    /* ---------------------------------------------------------
       Tabla de números 0..999 (sin ciclos ni recursión).
       --------------------------------------------------------- */
    CREATE TABLE #Numeros (N INT NOT NULL PRIMARY KEY);
    INSERT #Numeros (N)
    SELECT a.d + b.d * 10 + c.d * 100
    FROM       (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9)) AS a(d)
    CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9)) AS b(d)
    CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9)) AS c(d);

    /* ---------------------------------------------------------
       Catálogos (§8.2). Id fijos con IDENTITY_INSERT; los SP los
       buscan por Descripcion, así que el Id no es obligatorio.
       Si un Id ya existe con otra descripción, la fila se omite y la
       verificación final falla a propósito (se deshace la carga).
       --------------------------------------------------------- */
    SET IDENTITY_INSERT dbo.EstadosReserva ON;
    INSERT dbo.EstadosReserva (Id, Descripcion)
    SELECT v.Id, v.Descripcion
    FROM (VALUES (CAST(1 AS TINYINT), N'Activa'), (2, N'Liberada'), (3, N'Pagada')) AS v(Id, Descripcion)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.EstadosReserva e WHERE e.Descripcion = v.Descripcion OR e.Id = v.Id);
    SET IDENTITY_INSERT dbo.EstadosReserva OFF;

    SET IDENTITY_INSERT dbo.ResultadosPago ON;
    INSERT dbo.ResultadosPago (Id, Descripcion)
    SELECT v.Id, v.Descripcion
    FROM (VALUES (CAST(1 AS TINYINT), N'Aprobado'), (2, N'Rechazado')) AS v(Id, Descripcion)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.ResultadosPago r WHERE r.Descripcion = v.Descripcion OR r.Id = v.Id);
    SET IDENTITY_INSERT dbo.ResultadosPago OFF;

    /* ---------------------------------------------------------
       Sitios.
       --------------------------------------------------------- */
    INSERT dbo.Sitios (Clave, Descripcion, RequiereComprador, Moneda, ZonaHoraria)
    SELECT v.Clave, v.Descripcion, v.RequiereComprador, 'MXN', 'America/Mexico_City'
    FROM (VALUES ('web_1', N'Teatro Aquí nadie actúa normal', CAST(1 AS BIT)),
                 ('web_2', N'Cineclub',                       CAST(0 AS BIT))) AS v(Clave, Descripcion, RequiereComprador)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Sitios s WHERE s.Clave = v.Clave);

    DECLARE @IdSitio1 INT = (SELECT Id FROM dbo.Sitios WHERE Clave = 'web_1');
    DECLARE @IdSitio2 INT = (SELECT Id FROM dbo.Sitios WHERE Clave = 'web_2');

    /* =========================================================
       web_1 — Teatro (tarea 6.1)
       ========================================================= */
    INSERT dbo.Eventos (IdSitio, Nombre)
    SELECT @IdSitio1, N'¡Que no se entere la suegra!'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Eventos WHERE IdSitio = @IdSitio1 AND Nombre = N'¡Que no se entere la suegra!');

    DECLARE @IdEvento1 INT = (SELECT Id FROM dbo.Eventos WHERE IdSitio = @IdSitio1 AND Nombre = N'¡Que no se entere la suegra!');

    -- Zonas con sus filas y precio.
    CREATE TABLE #ZonasWeb1 (Descripcion NVARCHAR(100) NOT NULL, Fila VARCHAR(3) NOT NULL, Precio DECIMAL(10,2) NOT NULL);
    INSERT #ZonasWeb1 (Descripcion, Fila, Precio)
    VALUES (N'Preferente','A',800),(N'Preferente','B',800),(N'Preferente','C',800),
           (N'General','D',500),(N'General','E',500),(N'General','F',500),
           (N'General','G',500),(N'General','H',500),(N'General','I',500),
           (N'Balcón','J',300),(N'Balcón','K',300),(N'Balcón','L',300);

    INSERT dbo.Zonas (IdSitio, Descripcion, Capacidad)
    SELECT DISTINCT @IdSitio1, zw.Descripcion, CAST(NULL AS INT)
    FROM #ZonasWeb1 zw
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Zonas z WHERE z.IdSitio = @IdSitio1 AND z.Descripcion = zw.Descripcion);

    -- 120 asientos: filas A–L, números 1–10.
    INSERT dbo.Asientos (IdZona, Fila, Numero)
    SELECT z.Id, zw.Fila, CAST(n.N AS SMALLINT)
    FROM #ZonasWeb1 zw
    JOIN dbo.Zonas z ON z.IdSitio = @IdSitio1 AND z.Descripcion = zw.Descripcion
    JOIN #Numeros n  ON n.N BETWEEN 1 AND 10
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Asientos a WHERE a.IdZona = z.Id AND a.Fila = zw.Fila AND a.Numero = n.N);

    -- 120 funciones: jue (3), vie (4) y sáb (5) del 1 oct al 31 dic 2026, 15:00, 19:00 y 21:00 CDMX.
    CREATE TABLE #FuncionesWeb1 (FechaHoraInicio DATETIME2(0) NOT NULL PRIMARY KEY);
    INSERT #FuncionesWeb1 (FechaHoraInicio)
    SELECT DATEADD(MINUTE, h.MinutoLocal + @DesfaseUtcMinutos, CAST(d.Fecha AS DATETIME2(0)))
    FROM (SELECT DATEADD(DAY, n.N, CAST('20261001' AS DATE)) AS Fecha
          FROM #Numeros n
          WHERE n.N <= DATEDIFF(DAY, '20261001', '20261231')) AS d
    CROSS JOIN (VALUES (15 * 60), (19 * 60), (21 * 60)) AS h(MinutoLocal)
    WHERE DATEDIFF(DAY, '20000103', d.Fecha) % 7 IN (3, 4, 5);

    INSERT dbo.Funciones (IdEvento, IdZona, FechaHoraInicio)
    SELECT @IdEvento1, NULL, fw.FechaHoraInicio
    FROM #FuncionesWeb1 fw
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Funciones f
                      WHERE f.IdEvento = @IdEvento1 AND f.FechaHoraInicio = fw.FechaHoraInicio AND f.IdZona IS NULL);

    -- 360 precios: uno por zona y función.
    INSERT dbo.PreciosZonaFuncion (IdFuncion, IdZona, Precio, Moneda)
    SELECT f.Id, z.Id, p.Precio, 'MXN'
    FROM #FuncionesWeb1 fw
    JOIN dbo.Funciones f ON f.IdEvento = @IdEvento1 AND f.FechaHoraInicio = fw.FechaHoraInicio AND f.IdZona IS NULL
    CROSS JOIN (SELECT DISTINCT Descripcion, Precio FROM #ZonasWeb1) AS p
    JOIN dbo.Zonas z ON z.IdSitio = @IdSitio1 AND z.Descripcion = p.Descripcion
    WHERE NOT EXISTS (SELECT 1 FROM dbo.PreciosZonaFuncion pz WHERE pz.IdFuncion = f.Id AND pz.IdZona = z.Id);

    -- 14,400 asientos por función: los 120 asientos de la semilla en cada una de las 120 funciones.
    -- Sólo zonas y filas de #ZonasWeb1: si después se agregan zonas o asientos, no entran aquí (revisión sqlserver-dba).
    INSERT dbo.AsientosFuncion (IdFuncion, IdAsiento)
    SELECT f.Id, a.Id
    FROM #FuncionesWeb1 fw
    JOIN dbo.Funciones f ON f.IdEvento = @IdEvento1 AND f.FechaHoraInicio = fw.FechaHoraInicio AND f.IdZona IS NULL
    CROSS JOIN #ZonasWeb1 zw
    JOIN dbo.Zonas z    ON z.IdSitio = @IdSitio1 AND z.Descripcion = zw.Descripcion
    JOIN dbo.Asientos a ON a.IdZona = z.Id AND a.Fila = zw.Fila AND a.Numero BETWEEN 1 AND 10
    WHERE NOT EXISTS (SELECT 1 FROM dbo.AsientosFuncion af WHERE af.IdFuncion = f.Id AND af.IdAsiento = a.Id);

    /* =========================================================
       web_2 — Cineclub (tarea 6.2). Si el cineclub cambia valores,
       sólo se ajustan estas constantes.
       ========================================================= */
    DECLARE @Web2PrimerDia     DATE          = '20261119';
    DECLARE @Web2UltimoDia     DATE          = '20261218';   -- 30 días
    DECLARE @Web2Idioma        NVARCHAR(40)  = N'Por confirmar';
    DECLARE @Web2Clasificacion NVARCHAR(20)  = N'Por confirmar';
    DECLARE @Web2Duracion      INT           = 120;
    DECLARE @Web2Capacidad     INT           = 80;           -- 8 filas × 10

    INSERT dbo.Eventos (IdSitio, Nombre)
    SELECT @IdSitio2, N'Spider-Man'
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Eventos WHERE IdSitio = @IdSitio2 AND Nombre = N'Spider-Man');

    DECLARE @IdEvento2 INT = (SELECT Id FROM dbo.Eventos WHERE IdSitio = @IdSitio2 AND Nombre = N'Spider-Man');

    -- Salas 1–5 en 2D ($100) y 6–10 en 3D ($150).
    CREATE TABLE #Salas (Numero INT NOT NULL PRIMARY KEY, Descripcion NVARCHAR(100) NOT NULL,
                          Formato VARCHAR(10) NOT NULL, Precio DECIMAL(10,2) NOT NULL);
    INSERT #Salas (Numero, Descripcion, Formato, Precio)
    SELECT n.N, CONCAT(N'Sala ', n.N),
           CASE WHEN n.N <= 5 THEN '2D' ELSE '3D' END,
           CASE WHEN n.N <= 5 THEN 100 ELSE 150 END
    FROM #Numeros n
    WHERE n.N BETWEEN 1 AND 10;

    -- Horarios locales por formato, en minutos desde medianoche.
    CREATE TABLE #Horarios (Formato VARCHAR(10) NOT NULL, MinutoLocal INT NOT NULL, PRIMARY KEY (Formato, MinutoLocal));
    INSERT #Horarios (Formato, MinutoLocal)
    VALUES ('2D', 13 * 60), ('2D', 16 * 60), ('2D', 20 * 60),
           ('3D', 12 * 60 + 30), ('3D', 15 * 60 + 30), ('3D', 18 * 60 + 30);

    INSERT dbo.Zonas (IdSitio, Descripcion, Capacidad)
    SELECT @IdSitio2, s.Descripcion, @Web2Capacidad
    FROM #Salas s
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Zonas z WHERE z.IdSitio = @IdSitio2 AND z.Descripcion = s.Descripcion);

    -- 800 asientos: filas A–H, números 1–10, en cada sala.
    INSERT dbo.Asientos (IdZona, Fila, Numero)
    SELECT z.Id, fi.Fila, CAST(n.N AS SMALLINT)
    FROM #Salas s
    JOIN dbo.Zonas z ON z.IdSitio = @IdSitio2 AND z.Descripcion = s.Descripcion
    CROSS JOIN (VALUES ('A'),('B'),('C'),('D'),('E'),('F'),('G'),('H')) AS fi(Fila)
    JOIN #Numeros n ON n.N BETWEEN 1 AND 10
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Asientos a WHERE a.IdZona = z.Id AND a.Fila = fi.Fila AND a.Numero = n.N);

    -- 900 funciones: 30 días × 10 salas × 3 horarios.
    CREATE TABLE #FuncionesWeb2 (IdZona INT NOT NULL, FechaHoraInicio DATETIME2(0) NOT NULL,
                                  Formato VARCHAR(10) NOT NULL, Precio DECIMAL(10,2) NOT NULL,
                                  PRIMARY KEY (IdZona, FechaHoraInicio));
    INSERT #FuncionesWeb2 (IdZona, FechaHoraInicio, Formato, Precio)
    SELECT z.Id, DATEADD(MINUTE, h.MinutoLocal + @DesfaseUtcMinutos, CAST(d.Fecha AS DATETIME2(0))), s.Formato, s.Precio
    FROM (SELECT DATEADD(DAY, n.N, @Web2PrimerDia) AS Fecha
          FROM #Numeros n
          WHERE n.N <= DATEDIFF(DAY, @Web2PrimerDia, @Web2UltimoDia)) AS d
    CROSS JOIN #Salas s
    JOIN dbo.Zonas z ON z.IdSitio = @IdSitio2 AND z.Descripcion = s.Descripcion
    JOIN #Horarios h ON h.Formato = s.Formato;

    INSERT dbo.Funciones (IdEvento, IdZona, FechaHoraInicio, Formato, Idioma, Clasificacion, DuracionMinutos)
    SELECT @IdEvento2, fw.IdZona, fw.FechaHoraInicio, fw.Formato, @Web2Idioma, @Web2Clasificacion, @Web2Duracion
    FROM #FuncionesWeb2 fw
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Funciones f
                      WHERE f.IdEvento = @IdEvento2 AND f.FechaHoraInicio = fw.FechaHoraInicio AND f.IdZona = fw.IdZona);

    -- 900 precios: uno por función, sólo para su sala (RN30).
    INSERT dbo.PreciosZonaFuncion (IdFuncion, IdZona, Precio, Moneda)
    SELECT f.Id, fw.IdZona, fw.Precio, 'MXN'
    FROM #FuncionesWeb2 fw
    JOIN dbo.Funciones f ON f.IdEvento = @IdEvento2 AND f.FechaHoraInicio = fw.FechaHoraInicio AND f.IdZona = fw.IdZona
    WHERE NOT EXISTS (SELECT 1 FROM dbo.PreciosZonaFuncion pz WHERE pz.IdFuncion = f.Id AND pz.IdZona = fw.IdZona);

    -- 72,000 asientos por función: sólo los 80 asientos de la sala de cada función.
    INSERT dbo.AsientosFuncion (IdFuncion, IdAsiento)
    SELECT f.Id, a.Id
    FROM #FuncionesWeb2 fw
    JOIN dbo.Funciones f ON f.IdEvento = @IdEvento2 AND f.FechaHoraInicio = fw.FechaHoraInicio AND f.IdZona = fw.IdZona
    JOIN dbo.Asientos a  ON a.IdZona = fw.IdZona AND a.Fila BETWEEN 'A' AND 'H' AND LEN(a.Fila) = 1 AND a.Numero BETWEEN 1 AND 10
    WHERE NOT EXISTS (SELECT 1 FROM dbo.AsientosFuncion af WHERE af.IdFuncion = f.Id AND af.IdAsiento = a.Id);

    /* =========================================================
       Verificación (§8.4 y escenarios del contrato). Cuenta sólo los
       datos de la semilla, para que siga siendo válida si después se
       agregan funciones (§8.5). Si algo no cuadra, se deshace todo.
       ========================================================= */
    DECLARE @Verificacion TABLE (Concepto NVARCHAR(60) NOT NULL, Esperado INT NOT NULL, Obtenido INT NOT NULL);
    INSERT @Verificacion (Concepto, Esperado, Obtenido)
    VALUES
      (N'EstadosReserva',                3,     (SELECT COUNT(*) FROM dbo.EstadosReserva WHERE Descripcion IN (N'Activa', N'Liberada', N'Pagada'))),
      (N'ResultadosPago',                2,     (SELECT COUNT(*) FROM dbo.ResultadosPago WHERE Descripcion IN (N'Aprobado', N'Rechazado'))),
      (N'Sitios',                        2,     (SELECT COUNT(*) FROM dbo.Sitios WHERE Clave IN ('web_1', 'web_2'))),
      (N'web_1 zonas',                   3,     (SELECT COUNT(*) FROM dbo.Zonas z WHERE z.IdSitio = @IdSitio1
                                                  AND z.Descripcion IN (SELECT Descripcion FROM #ZonasWeb1))),
      (N'web_1 asientos',                120,   (SELECT COUNT(*) FROM dbo.Asientos a JOIN dbo.Zonas z ON z.Id = a.IdZona
                                                  JOIN #ZonasWeb1 zw ON zw.Descripcion = z.Descripcion AND zw.Fila = a.Fila
                                                  WHERE z.IdSitio = @IdSitio1 AND a.Numero BETWEEN 1 AND 10)),
      (N'web_1 funciones',               120,   (SELECT COUNT(*) FROM dbo.Funciones f JOIN #FuncionesWeb1 fw ON fw.FechaHoraInicio = f.FechaHoraInicio
                                                  WHERE f.IdEvento = @IdEvento1 AND f.IdZona IS NULL)),
      (N'web_1 precios',                 360,   (SELECT COUNT(*) FROM dbo.PreciosZonaFuncion p JOIN dbo.Funciones f ON f.Id = p.IdFuncion
                                                  JOIN #FuncionesWeb1 fw ON fw.FechaHoraInicio = f.FechaHoraInicio
                                                  WHERE f.IdEvento = @IdEvento1 AND f.IdZona IS NULL)),
      (N'web_1 asientos por función',    14400, (SELECT COUNT(*) FROM dbo.AsientosFuncion af JOIN dbo.Funciones f ON f.Id = af.IdFuncion
                                                  JOIN #FuncionesWeb1 fw ON fw.FechaHoraInicio = f.FechaHoraInicio
                                                  JOIN dbo.Asientos a ON a.Id = af.IdAsiento AND a.Numero BETWEEN 1 AND 10
                                                  JOIN dbo.Zonas z ON z.Id = a.IdZona
                                                  JOIN #ZonasWeb1 zw ON zw.Descripcion = z.Descripcion AND zw.Fila = a.Fila
                                                  WHERE f.IdEvento = @IdEvento1 AND f.IdZona IS NULL)),
      (N'web_2 salas',                   10,    (SELECT COUNT(*) FROM dbo.Zonas z JOIN #Salas s ON s.Descripcion = z.Descripcion
                                                  WHERE z.IdSitio = @IdSitio2 AND z.Capacidad = @Web2Capacidad)),
      (N'web_2 asientos',                800,   (SELECT COUNT(*) FROM dbo.Asientos a JOIN dbo.Zonas z ON z.Id = a.IdZona
                                                  JOIN #Salas s ON s.Descripcion = z.Descripcion
                                                  WHERE z.IdSitio = @IdSitio2 AND a.Fila BETWEEN 'A' AND 'H' AND LEN(a.Fila) = 1
                                                    AND a.Numero BETWEEN 1 AND 10)),
      (N'web_2 funciones',               900,   (SELECT COUNT(*) FROM dbo.Funciones f JOIN #FuncionesWeb2 fw
                                                  ON fw.IdZona = f.IdZona AND fw.FechaHoraInicio = f.FechaHoraInicio
                                                  WHERE f.IdEvento = @IdEvento2)),
      (N'web_2 precios',                 900,   (SELECT COUNT(*) FROM dbo.PreciosZonaFuncion p JOIN dbo.Funciones f ON f.Id = p.IdFuncion
                                                  JOIN #FuncionesWeb2 fw ON fw.IdZona = f.IdZona AND fw.FechaHoraInicio = f.FechaHoraInicio
                                                  WHERE f.IdEvento = @IdEvento2 AND p.IdZona = f.IdZona)),
      (N'web_2 asientos por función',    72000, (SELECT COUNT(*) FROM dbo.AsientosFuncion af JOIN dbo.Funciones f ON f.Id = af.IdFuncion
                                                  JOIN #FuncionesWeb2 fw ON fw.IdZona = f.IdZona AND fw.FechaHoraInicio = f.FechaHoraInicio
                                                  JOIN dbo.Asientos a ON a.Id = af.IdAsiento AND a.IdZona = f.IdZona
                                                   AND a.Fila BETWEEN 'A' AND 'H' AND LEN(a.Fila) = 1 AND a.Numero BETWEEN 1 AND 10
                                                  WHERE f.IdEvento = @IdEvento2));

    IF EXISTS (SELECT 1 FROM @Verificacion WHERE Esperado <> Obtenido)
    BEGIN
        SELECT Concepto, Esperado, Obtenido FROM @Verificacion WHERE Esperado <> Obtenido;
        THROW 50000, N'05_datos_iniciales: los conteos de la semilla no cuadran; se deshizo la carga.', 1;
    END;

    COMMIT TRANSACTION;

    SELECT Concepto, Esperado, Obtenido, N'OK' AS Resultado FROM @Verificacion;
    PRINT N'05_datos_iniciales: carga completa y verificada.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    -- IDENTITY_INSERT es un ajuste de sesión y el ROLLBACK no lo apaga (revisión sqlserver-dba).
    SET IDENTITY_INSERT dbo.EstadosReserva OFF;
    SET IDENTITY_INSERT dbo.ResultadosPago OFF;
    THROW;
END CATCH;
GO

DROP TABLE IF EXISTS #Numeros, #ZonasWeb1, #FuncionesWeb1, #Salas, #Horarios, #FuncionesWeb2;
GO
