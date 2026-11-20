/* =============================================================
   02_tablas.sql — Las 16 tablas de CitasBD
   -------------------------------------------------------------
   Proyecto : citas_backend (change impl-backend, tareas 2.2 a 2.6)
   Ejecutar : después de 01_crear_bd.sql.
   Fuentes  : contrato-entre-capas y backend-esquema-contrato (mandan
              si hay diferencia), BCK_DEFINICION.md §6 (diccionario) y
              BCK_ESPECIFICACION.md §3 (cambios al esquema).

   Contenido: PK, FK, UQ, CK y DF de cada tabla, en orden de
   dependencias. No van aquí (03_indices.sql):
     - UQ_Funciones_IdEvento_FechaHoraInicio (tarea 3.1)
     - UQ_AsientosFuncion_IdFuncion_IdAsiento (lleva INCLUDE, §4)
     - los índices IX_ adicionales.
   Las filas de catálogo (Sitios, EstadosReserva, ResultadosPago)
   se cargan en 05_datos_iniciales.sql.

   Idempotente: cada tabla se crea sólo si no existe. Aún no hay
   base desplegada, así que los cambios del contrato se escriben
   directamente en el CREATE TABLE (D8).

   Convenciones (BCK_DEFINICION.md §6): Id IDENTITY como PK_<Tabla>;
   FechaRegistro DATETIME2(3) con DF = SYSUTCDATETIME(); catálogos y
   entidades con Activo BIT DF 1. Fechas de negocio en UTC (RN24).
   ============================================================= */
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;   -- requerido por columnas calculadas PERSISTED e índices filtrados
GO

USE CitasBD;
GO

/* ---------------------------- 1. Catálogos ---------------------------- */

-- Sitios web que usan la base. RequiereComprador: 1 = web_1 (con cuenta), 0 = web_2 (sin cuenta). Tarea 2.2.
-- Un sitio nuevo (promt.md, punto 3) se integra sólo con datos: una fila aquí con su clave,
-- si pide cuenta, su moneda y su zona horaria; luego sus zonas, asientos, eventos y funciones.
IF OBJECT_ID(N'dbo.Sitios', N'U') IS NULL
CREATE TABLE dbo.Sitios
(
    Id                  INT            IDENTITY(1,1) NOT NULL,
    Clave               VARCHAR(20)    NOT NULL,   -- valor de X-Sitio (web_1, web_2)
    Descripcion         NVARCHAR(100)  NOT NULL,   -- nombre visible del negocio (Recinto)
    RequiereComprador   BIT            NOT NULL CONSTRAINT DF_Sitios_RequiereComprador DEFAULT (1),
    Moneda              CHAR(3)        NOT NULL CONSTRAINT DF_Sitios_Moneda DEFAULT ('MXN'),   -- moneda del sitio (contrato: web_1 y web_2 = MXN)
    ZonaHoraria         VARCHAR(64)    NOT NULL CONSTRAINT DF_Sitios_ZonaHoraria DEFAULT ('America/Mexico_City'),   -- IANA, como la usa el servicio
    Activo              BIT            NOT NULL CONSTRAINT DF_Sitios_Activo DEFAULT (1),
    FechaRegistro       DATETIME2(3)   NOT NULL CONSTRAINT DF_Sitios_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Sitios        PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Sitios_Clave  UNIQUE (Clave),
    CONSTRAINT CK_Sitios_Moneda CHECK (Moneda IN ('MXN', 'USD'))   -- proyecto USA / México
);
GO

-- Zonas de asientos. En web_2 cada sala es una zona con Capacidad 80 (design §5). Tarea 2.4.
IF OBJECT_ID(N'dbo.Zonas', N'U') IS NULL
CREATE TABLE dbo.Zonas
(
    Id              INT            IDENTITY(1,1) NOT NULL,
    IdSitio         INT            NOT NULL,
    Descripcion     NVARCHAR(100)  NOT NULL,
    Capacidad       INT            NULL,           -- NULL en web_1
    Activo          BIT            NOT NULL CONSTRAINT DF_Zonas_Activo DEFAULT (1),
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_Zonas_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Zonas                     PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Zonas_Sitios              FOREIGN KEY (IdSitio) REFERENCES dbo.Sitios (Id),
    CONSTRAINT UQ_Zonas_IdSitio_Descripcion UNIQUE (IdSitio, Descripcion),
    CONSTRAINT CK_Zonas_Capacidad           CHECK (Capacidad > 0)
);
GO

-- Estados de una reserva: 1 Activa, 2 Liberada, 3 Pagada. "Vencida" no se guarda (RN02).
IF OBJECT_ID(N'dbo.EstadosReserva', N'U') IS NULL
CREATE TABLE dbo.EstadosReserva
(
    Id              TINYINT        IDENTITY(1,1) NOT NULL,
    Descripcion     NVARCHAR(30)   NOT NULL,
    Activo          BIT            NOT NULL CONSTRAINT DF_EstadosReserva_Activo DEFAULT (1),
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_EstadosReserva_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_EstadosReserva             PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_EstadosReserva_Descripcion UNIQUE (Descripcion)
);
GO

-- Resultados de un intento de pago: 1 Aprobado, 2 Rechazado.
IF OBJECT_ID(N'dbo.ResultadosPago', N'U') IS NULL
CREATE TABLE dbo.ResultadosPago
(
    Id              TINYINT        IDENTITY(1,1) NOT NULL,
    Descripcion     NVARCHAR(30)   NOT NULL,
    Activo          BIT            NOT NULL CONSTRAINT DF_ResultadosPago_Activo DEFAULT (1),
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_ResultadosPago_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ResultadosPago             PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_ResultadosPago_Descripcion UNIQUE (Descripcion)
);
GO

/* ---------------------------- 2. Entidades ---------------------------- */

-- Compradores (sólo web_1). Correo único en minúsculas (RN21); sólo el hash de la contraseña (RN22).
IF OBJECT_ID(N'dbo.Compradores', N'U') IS NULL
CREATE TABLE dbo.Compradores
(
    Id              INT            IDENTITY(1,1) NOT NULL,
    Nombre          NVARCHAR(150)  NOT NULL,
    Correo          NVARCHAR(254)  NOT NULL,
    HashContrasena  VARCHAR(255)   NOT NULL,
    Activo          BIT            NOT NULL CONSTRAINT DF_Compradores_Activo DEFAULT (1),
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_Compradores_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Compradores        PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Compradores_Correo UNIQUE (Correo)
);
GO

IF OBJECT_ID(N'dbo.Eventos', N'U') IS NULL
CREATE TABLE dbo.Eventos
(
    Id              INT             IDENTITY(1,1) NOT NULL,
    IdSitio         INT             NOT NULL,
    Nombre          NVARCHAR(150)   NOT NULL,
    Descripcion     NVARCHAR(1000)  NULL,
    Activo          BIT             NOT NULL CONSTRAINT DF_Eventos_Activo DEFAULT (1),
    FechaRegistro   DATETIME2(3)    NOT NULL CONSTRAINT DF_Eventos_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Eventos        PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Eventos_Sitios FOREIGN KEY (IdSitio) REFERENCES dbo.Sitios (Id)
);
GO

-- Funciones. IdZona = sala de web_2 (NULL en web_1, RN30). Formato, Idioma, Clasificacion y
-- DuracionMinutos quedan NULL en web_1 y se llenan en la semilla de web_2 (tarea 2.4, contrato).
-- La unicidad por evento y hora se crea en 03_indices.sql (tarea 3.1).
IF OBJECT_ID(N'dbo.Funciones', N'U') IS NULL
CREATE TABLE dbo.Funciones
(
    Id                INT            IDENTITY(1,1) NOT NULL,
    IdEvento          INT            NOT NULL,
    IdZona            INT            NULL,
    FechaHoraInicio   DATETIME2(0)   NOT NULL,     -- UTC (E18)
    Formato           VARCHAR(10)    NULL,         -- '2D' o '3D'
    Idioma            NVARCHAR(40)   NULL,
    Clasificacion     NVARCHAR(20)   NULL,
    DuracionMinutos   INT            NULL,
    Activo            BIT            NOT NULL CONSTRAINT DF_Funciones_Activo DEFAULT (1),   -- 0 si se cancela (E17)
    FechaRegistro     DATETIME2(3)   NOT NULL CONSTRAINT DF_Funciones_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Funciones                 PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Funciones_Eventos         FOREIGN KEY (IdEvento) REFERENCES dbo.Eventos (Id),
    CONSTRAINT FK_Funciones_Zonas           FOREIGN KEY (IdZona)   REFERENCES dbo.Zonas (Id),
    CONSTRAINT CK_Funciones_Formato         CHECK (Formato IN ('2D', '3D')),
    CONSTRAINT CK_Funciones_DuracionMinutos CHECK (DuracionMinutos > 0)
);
GO

-- Asientos de una zona. Etiqueta calculada: A7, L10.
IF OBJECT_ID(N'dbo.Asientos', N'U') IS NULL
CREATE TABLE dbo.Asientos
(
    Id              INT            IDENTITY(1,1) NOT NULL,
    IdZona          INT            NOT NULL,
    Fila            VARCHAR(3)     NOT NULL,
    Numero          SMALLINT       NOT NULL,
    Etiqueta        AS (Fila + CAST(Numero AS VARCHAR(5))) PERSISTED,
    Activo          BIT            NOT NULL CONSTRAINT DF_Asientos_Activo DEFAULT (1),
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_Asientos_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Asientos                    PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Asientos_Zonas              FOREIGN KEY (IdZona) REFERENCES dbo.Zonas (Id),
    CONSTRAINT UQ_Asientos_IdZona_Fila_Numero UNIQUE (IdZona, Fila, Numero),
    CONSTRAINT CK_Asientos_Numero             CHECK (Numero > 0)
);
GO

-- Precio de cada zona en cada función. Una sola moneda por función (RN32).
IF OBJECT_ID(N'dbo.PreciosZonaFuncion', N'U') IS NULL
CREATE TABLE dbo.PreciosZonaFuncion
(
    Id              INT            IDENTITY(1,1) NOT NULL,
    IdFuncion       INT            NOT NULL,
    IdZona          INT            NOT NULL,
    Precio          DECIMAL(10,2)  NOT NULL,
    Moneda          CHAR(3)        NOT NULL CONSTRAINT DF_PreciosZonaFuncion_Moneda DEFAULT ('MXN'),
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_PreciosZonaFuncion_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_PreciosZonaFuncion                 PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_PreciosZonaFuncion_Funciones       FOREIGN KEY (IdFuncion) REFERENCES dbo.Funciones (Id),
    CONSTRAINT FK_PreciosZonaFuncion_Zonas           FOREIGN KEY (IdZona)    REFERENCES dbo.Zonas (Id),
    CONSTRAINT UQ_PreciosZonaFuncion_IdFuncion_IdZona UNIQUE (IdFuncion, IdZona),
    CONSTRAINT CK_PreciosZonaFuncion_Precio          CHECK (Precio >= 0),
    CONSTRAINT CK_PreciosZonaFuncion_Moneda          CHECK (Moneda IN ('MXN', 'USD'))
);
GO

/* --------------------------- 3. Transacciones -------------------------- */

-- Reservas. IdComprador admite NULL: web_2 reserva sin comprador (P15, tarea 2.3).
-- IdPublico: id que ve el servicio (UUID v4 no adivinable, contrato «Sitios sin cuenta»);
-- Id BIGINT queda sólo como clave interna (aprobado por la usuaria el 20 nov 2026).
IF OBJECT_ID(N'dbo.Reservas', N'U') IS NULL
CREATE TABLE dbo.Reservas
(
    Id                BIGINT           IDENTITY(1,1) NOT NULL,
    IdPublico         UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Reservas_IdPublico DEFAULT (NEWID()),
    IdComprador       INT            NULL,
    IdSitio           INT            NOT NULL,
    IdFuncion         INT            NOT NULL,
    IdEstadoReserva   TINYINT        NOT NULL,
    CreadaEn          DATETIME2(3)   NOT NULL,     -- @Ahora del servicio
    ExpiraEn          DATETIME2(3)   NOT NULL,     -- enviado por el servicio (E15)
    Total             DECIMAL(12,2)  NOT NULL,
    FechaRegistro     DATETIME2(3)   NOT NULL CONSTRAINT DF_Reservas_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Reservas                PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT UQ_Reservas_IdPublico      UNIQUE (IdPublico),
    CONSTRAINT FK_Reservas_Compradores    FOREIGN KEY (IdComprador)     REFERENCES dbo.Compradores (Id),
    CONSTRAINT FK_Reservas_Sitios         FOREIGN KEY (IdSitio)         REFERENCES dbo.Sitios (Id),
    CONSTRAINT FK_Reservas_Funciones      FOREIGN KEY (IdFuncion)       REFERENCES dbo.Funciones (Id),
    CONSTRAINT FK_Reservas_EstadosReserva FOREIGN KEY (IdEstadoReserva) REFERENCES dbo.EstadosReserva (Id),
    CONSTRAINT CK_Reservas_ExpiraEn       CHECK (ExpiraEn > CreadaEn),
    CONSTRAINT CK_Reservas_Total          CHECK (Total >= 0)
);
GO

-- Asientos de cada reserva con el precio tomado al apartar (RN10).
IF OBJECT_ID(N'dbo.ReservasAsientos', N'U') IS NULL
CREATE TABLE dbo.ReservasAsientos
(
    Id              BIGINT         IDENTITY(1,1) NOT NULL,
    IdReserva       BIGINT         NOT NULL,
    IdAsiento       INT            NOT NULL,
    PrecioTomado    DECIMAL(10,2)  NOT NULL,
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_ReservasAsientos_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_ReservasAsientos                   PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_ReservasAsientos_Reservas          FOREIGN KEY (IdReserva) REFERENCES dbo.Reservas (Id),
    CONSTRAINT FK_ReservasAsientos_Asientos          FOREIGN KEY (IdAsiento) REFERENCES dbo.Asientos (Id),
    CONSTRAINT UQ_ReservasAsientos_IdReserva_IdAsiento UNIQUE (IdReserva, IdAsiento),
    CONSTRAINT CK_ReservasAsientos_PrecioTomado      CHECK (PrecioTomado >= 0)
);
GO

-- Estado de cada asiento en cada función (ADR-002). Su UQ con INCLUDE va en 03_indices.sql.
IF OBJECT_ID(N'dbo.AsientosFuncion', N'U') IS NULL
CREATE TABLE dbo.AsientosFuncion
(
    Id                INT            IDENTITY(1,1) NOT NULL,
    IdFuncion         INT            NOT NULL,
    IdAsiento         INT            NOT NULL,
    IdReservaActual   BIGINT         NULL,         -- reserva que lo aparta o lo compró
    ExpiraEn          DATETIME2(3)   NULL,         -- copia del vencimiento de la reserva
    Vendido           BIT            NOT NULL CONSTRAINT DF_AsientosFuncion_Vendido DEFAULT (0),
    FechaRegistro     DATETIME2(3)   NOT NULL CONSTRAINT DF_AsientosFuncion_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_AsientosFuncion           PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_AsientosFuncion_Funciones FOREIGN KEY (IdFuncion)       REFERENCES dbo.Funciones (Id),
    CONSTRAINT FK_AsientosFuncion_Asientos  FOREIGN KEY (IdAsiento)       REFERENCES dbo.Asientos (Id),
    CONSTRAINT FK_AsientosFuncion_Reservas  FOREIGN KEY (IdReservaActual) REFERENCES dbo.Reservas (Id),
    -- Un asiento vendido conserva la reserva que lo compró y ya no vence (RN15).
    CONSTRAINT CK_AsientosFuncion_Vendido   CHECK (Vendido = 0 OR (IdReservaActual IS NOT NULL AND ExpiraEn IS NULL))
);
GO

-- Intentos de pago. Sólo los últimos 4 dígitos; nunca el número completo ni el CVV (D14, P19, tarea 2.5).
IF OBJECT_ID(N'dbo.IntentosPago', N'U') IS NULL
CREATE TABLE dbo.IntentosPago
(
    Id                BIGINT         IDENTITY(1,1) NOT NULL,
    IdReserva         BIGINT         NOT NULL,
    IdResultadoPago   TINYINT        NOT NULL,
    UltimosDigitos    CHAR(4)        NOT NULL,
    FechaIntento      DATETIME2(3)   NOT NULL,     -- @Ahora
    FechaRegistro     DATETIME2(3)   NOT NULL CONSTRAINT DF_IntentosPago_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_IntentosPago                PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_IntentosPago_Reservas       FOREIGN KEY (IdReserva)       REFERENCES dbo.Reservas (Id),
    CONSTRAINT FK_IntentosPago_ResultadosPago FOREIGN KEY (IdResultadoPago) REFERENCES dbo.ResultadosPago (Id),
    CONSTRAINT CK_IntentosPago_UltimosDigitos CHECK (UltimosDigitos NOT LIKE '%[^0-9]%')
);
GO

-- Órdenes. Folio ORD-000123 calculado del Id (RN19). IdComprador NULL en web_2 (P15, tarea 2.3).
IF OBJECT_ID(N'dbo.Ordenes', N'U') IS NULL
CREATE TABLE dbo.Ordenes
(
    Id              BIGINT         IDENTITY(1,1) NOT NULL,
    Folio           AS ('ORD-' + CASE WHEN Id <= 999999
                                      THEN RIGHT('000000' + CAST(Id AS VARCHAR(20)), 6)
                                      ELSE CAST(Id AS VARCHAR(20)) END) PERSISTED,
    IdReserva       BIGINT         NOT NULL,
    IdComprador     INT            NULL,
    IdSitio         INT            NOT NULL,
    Total           DECIMAL(12,2)  NOT NULL,
    FechaCompra     DATETIME2(3)   NOT NULL,       -- @Ahora al pagar
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_Ordenes_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Ordenes             PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Ordenes_Reservas    FOREIGN KEY (IdReserva)   REFERENCES dbo.Reservas (Id),
    CONSTRAINT FK_Ordenes_Compradores FOREIGN KEY (IdComprador) REFERENCES dbo.Compradores (Id),
    CONSTRAINT FK_Ordenes_Sitios      FOREIGN KEY (IdSitio)     REFERENCES dbo.Sitios (Id),
    CONSTRAINT UQ_Ordenes_Folio       UNIQUE (Folio),
    CONSTRAINT UQ_Ordenes_IdReserva   UNIQUE (IdReserva),     -- una orden por reserva (RN17)
    CONSTRAINT CK_Ordenes_Total       CHECK (Total >= 0)
);
GO

-- Boletos. Un asiento de una función nunca tiene dos boletos (RN18). Código de 12 caracteres (RN20).
IF OBJECT_ID(N'dbo.Boletos', N'U') IS NULL
CREATE TABLE dbo.Boletos
(
    Id              BIGINT         IDENTITY(1,1) NOT NULL,
    IdOrden         BIGINT         NOT NULL,
    IdFuncion       INT            NOT NULL,
    IdAsiento       INT            NOT NULL,
    Precio          DECIMAL(10,2)  NOT NULL,
    Codigo          CHAR(12)       NOT NULL,
    FechaRegistro   DATETIME2(3)   NOT NULL CONSTRAINT DF_Boletos_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Boletos                   PRIMARY KEY CLUSTERED (Id),
    CONSTRAINT FK_Boletos_Ordenes           FOREIGN KEY (IdOrden)   REFERENCES dbo.Ordenes (Id),
    CONSTRAINT FK_Boletos_Funciones         FOREIGN KEY (IdFuncion) REFERENCES dbo.Funciones (Id),
    CONSTRAINT FK_Boletos_Asientos          FOREIGN KEY (IdAsiento) REFERENCES dbo.Asientos (Id),
    CONSTRAINT UQ_Boletos_IdFuncion_IdAsiento UNIQUE (IdFuncion, IdAsiento),
    CONSTRAINT UQ_Boletos_Codigo            UNIQUE (Codigo),
    CONSTRAINT CK_Boletos_Precio            CHECK (Precio >= 0)
);
GO

/* ----------------------------- 4. Soporte ----------------------------- */

-- Errores no previstos de los SP (RN27). Uso interno; no se expone al servicio.
IF OBJECT_ID(N'dbo.BitacoraErrores', N'U') IS NULL
CREATE TABLE dbo.BitacoraErrores
(
    Id              BIGINT          IDENTITY(1,1) NOT NULL,
    Procedimiento   NVARCHAR(128)   NULL,
    NumeroError     INT             NOT NULL,
    Severidad       INT             NULL,
    Estado          INT             NULL,
    Linea           INT             NULL,
    Mensaje         NVARCHAR(4000)  NOT NULL,
    FechaRegistro   DATETIME2(3)    NOT NULL CONSTRAINT DF_BitacoraErrores_FechaRegistro DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_BitacoraErrores PRIMARY KEY CLUSTERED (Id)
);
GO

-- =============================================================
-- PRUEBAS / VERIFICACIÓN
-- =============================================================
-- 1) Esperado: 16 tablas.
SELECT COUNT(*) AS TablasCreadas
FROM   sys.tables
WHERE  schema_id = SCHEMA_ID(N'dbo')
  AND  name IN (N'Sitios', N'Zonas', N'EstadosReserva', N'ResultadosPago', N'Compradores',
                N'Eventos', N'Funciones', N'Asientos', N'PreciosZonaFuncion', N'Reservas',
                N'ReservasAsientos', N'AsientosFuncion', N'IntentosPago', N'Ordenes',
                N'Boletos', N'BitacoraErrores');

-- 2) Tarea 2.6. Esperado: 0 filas (ninguna columna con número de tarjeta ni CVV).
SELECT t.name AS Tabla, c.name AS Columna
FROM   sys.columns AS c
JOIN   sys.tables  AS t ON t.object_id = c.object_id
WHERE  c.name LIKE N'%Tarjeta%' OR c.name LIKE N'%CVV%' OR c.name LIKE N'%CVC%'
   OR  c.name LIKE N'%Card%'    OR c.name LIKE N'%Pan%' OR c.name LIKE N'%NumeroCompleto%';
GO
