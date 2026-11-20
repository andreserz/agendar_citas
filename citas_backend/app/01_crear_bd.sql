/* =============================================================
   01_crear_bd.sql — Crea la base CitasBD y el rol del servicio
   -------------------------------------------------------------
   Proyecto : citas_backend (change impl-backend, tarea 2.1)
   Motor    : SQL Server 2019 o superior (contrato entre capas)
   Ejecutar : primero de los cinco scripts (01 a 05), en SSMS o con
              sqlcmd -I (QUOTED_IDENTIFIER ON).
   Fuentes  : BCK_ESPECIFICACION.md §9, contrato-entre-capas.

   Idempotente: si la base o el rol ya existen, no hace nada.
   No crea inicios de sesión ni usuarios: llevarían contraseña
   (ver la guía en citas_backend/.env.example).
   ============================================================= */
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

USE master;
GO

-- Base de datos sin distinción de mayúsculas (RN21).
-- Modelo de recuperación SIMPLE (entorno de demo): sólo al crearla, para no
-- cambiar la configuración de una base existente.
IF DB_ID(N'CitasBD') IS NULL
BEGIN
    CREATE DATABASE CitasBD COLLATE Modern_Spanish_CI_AS;
    ALTER DATABASE CitasBD SET RECOVERY SIMPLE;
    PRINT N'Base CitasBD creada.';
END
ELSE
    PRINT N'La base CitasBD ya existe; no se modifica.';
GO

USE CitasBD;
GO

-- Rol del servicio: sólo tendrá EXECUTE sobre el esquema dbo (se otorga en 04_sps.sql, RNF-B07).
IF DATABASE_PRINCIPAL_ID(N'rolCitasServicio') IS NULL
BEGIN
    CREATE ROLE rolCitasServicio AUTHORIZATION dbo;
    PRINT N'Rol rolCitasServicio creado.';
END
GO

-- =============================================================
-- PRUEBAS / VERIFICACIÓN
-- =============================================================
-- Esperado: CitasBD | Modern_Spanish_CI_AS | SIMPLE | 1 (el rol existe)
SELECT  d.name                                               AS BaseDatos,
        d.collation_name                                     AS Intercalacion,
        d.recovery_model_desc                                AS Recuperacion,
        CASE WHEN DATABASE_PRINCIPAL_ID(N'rolCitasServicio') IS NULL
             THEN 0 ELSE 1 END                               AS RolExiste
FROM    sys.databases AS d
WHERE   d.name = DB_NAME();
GO
