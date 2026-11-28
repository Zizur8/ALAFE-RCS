/* ==========================================================================================
   SCRIPT:   003b_Agenda_Horarios_Y_NotaGeneral.sql
   PROYECTO: ALAFE — Horarios por Defecto por Día y Nota General Fija por Agenda
   MOTOR:    Microsoft SQL Server (compatible con EF Core / .NET 10)
   DEPENDENCIAS: 001_Core_Auth_MultiTenant_And_Seed.sql, 003_Configuracion_Global_Y_Agenda.sql
   ========================================================================================== */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO

/* ==========================================================================================
   1. AGENDAS — Agrega NotaGeneral y bandera MostrarNotaGeneral
   ========================================================================================== */
IF COL_LENGTH(N'dbo.Agendas', N'NotaGeneral') IS NULL
BEGIN
    ALTER TABLE dbo.Agendas
    ADD NotaGeneral NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH(N'dbo.Agendas', N'MostrarNotaGeneral') IS NULL
BEGIN
    ALTER TABLE dbo.Agendas
    ADD MostrarNotaGeneral BIT NOT NULL
        CONSTRAINT DF_Agendas_MostrarNotaGeneral DEFAULT (0);
END;
GO

/* ==========================================================================================
   2. AGENDAHORARIOSDEFAULT — Horarios dinámicos por día de la semana (1 = Lunes .. 7 = Domingo)
      · CHECK (HoraFin <> HoraInicio) permite horarios que crucen medianoche (ej. 18:00 a 02:00).
      · Sin cascadas (ON DELETE NO ACTION) para prevenir Error 1785.
   ========================================================================================== */
IF OBJECT_ID(N'dbo.AgendaHorariosDefault', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AgendaHorariosDefault
    (
        AgendaId    INT       NOT NULL,
        DiaSemana   TINYINT   NOT NULL,
        Activo      BIT       NOT NULL
            CONSTRAINT DF_AgendaHorariosDefault_Activo DEFAULT (1),
        HoraInicio  TIME(0)   NOT NULL
            CONSTRAINT DF_AgendaHorariosDefault_HoraInicio DEFAULT ('10:00:00'),
        HoraFin     TIME(0)   NOT NULL
            CONSTRAINT DF_AgendaHorariosDefault_HoraFin DEFAULT ('22:00:00'),

        CONSTRAINT PK_AgendaHorariosDefault PRIMARY KEY (AgendaId, DiaSemana),
        CONSTRAINT CK_AgendaHorariosDefault_DiaSemana
            CHECK (DiaSemana BETWEEN 1 AND 7),
        CONSTRAINT CK_AgendaHorariosDefault_RangoValido
            CHECK (HoraFin <> HoraInicio),
        CONSTRAINT FK_AgendaHorariosDefault_Agendas
            FOREIGN KEY (AgendaId) REFERENCES dbo.Agendas (Id)
            ON DELETE NO ACTION
    );
END;
GO

/* ==========================================================================================
   3. BACKFILL IDEMPOTENTE — Crea los 7 días por defecto (10:00 a 22:00, activos)
      para todas las agendas existentes que aún no los tengan.
   ========================================================================================== */
;WITH Dias AS
(
    SELECT CAST(1 AS TINYINT) AS DiaSemana
    UNION ALL SELECT CAST(2 AS TINYINT)
    UNION ALL SELECT CAST(3 AS TINYINT)
    UNION ALL SELECT CAST(4 AS TINYINT)
    UNION ALL SELECT CAST(5 AS TINYINT)
    UNION ALL SELECT CAST(6 AS TINYINT)
    UNION ALL SELECT CAST(7 AS TINYINT)
)
INSERT INTO dbo.AgendaHorariosDefault (AgendaId, DiaSemana, Activo, HoraInicio, HoraFin)
SELECT
    a.Id,
    d.DiaSemana,
    1,
    CAST('10:00:00' AS TIME(0)),
    CAST('22:00:00' AS TIME(0))
FROM dbo.Agendas AS a
CROSS JOIN Dias AS d
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.AgendaHorariosDefault AS h
    WHERE h.AgendaId = a.Id
      AND h.DiaSemana = d.DiaSemana
);
GO

/* ==========================================================================================
   4. VERIFICACIÓN RÁPIDA
   ========================================================================================== */
SELECT
    a.Id,
    a.NombreComercial,
    a.MostrarNotaGeneral,
    a.NotaGeneral,
    COUNT(h.DiaSemana) AS DiasConfigurados
FROM dbo.Agendas AS a
LEFT JOIN dbo.AgendaHorariosDefault AS h
    ON h.AgendaId = a.Id
GROUP BY
    a.Id,
    a.NombreComercial,
    a.MostrarNotaGeneral,
    a.NotaGeneral;
GO
