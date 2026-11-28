/* ==========================================================================================
   SCRIPT:   003_Configuracion_Global_Y_Agenda.sql
   PROYECTO: ALAFE — Configuración Global (Propietario) y Reglas Operativas por Agenda
   MOTOR:    Microsoft SQL Server (compatible con EF Core / .NET 10)
   DEPENDENCIAS: 001_Core_Auth_MultiTenant_And_Seed.sql
   ========================================================================================== */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO

/* ==========================================================================================
   1. CONFIGURACIONPROPIETARIO — Configuración global 1:1 con Propietarios
      · Reutiliza dbo.Monedas(Codigo) CHAR(3).
      · Sin cascadas (ON DELETE NO ACTION) para prevenir Error 1785.
   ========================================================================================== */
IF OBJECT_ID(N'dbo.ConfiguracionPropietario', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConfiguracionPropietario
    (
        PropietarioId               INT           NOT NULL,
        MonedaPredeterminadaCodigo  CHAR(3)       NOT NULL
            CONSTRAINT DF_ConfProp_MonedaCodigo DEFAULT ('MXN'),
        FormatoFecha                VARCHAR(16)   NOT NULL
            CONSTRAINT DF_ConfProp_FormatoFecha DEFAULT ('DD/MM/YYYY'),
        MostrarFinesDeSemanaPrimero BIT           NOT NULL
            CONSTRAINT DF_ConfProp_FinesSemana  DEFAULT (0),
        FechaActualizacion          DATETIME2(3)  NOT NULL
            CONSTRAINT DF_ConfProp_FechaActualizacion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_ConfiguracionPropietario PRIMARY KEY (PropietarioId),
        CONSTRAINT CK_ConfProp_FormatoFecha
            CHECK (FormatoFecha IN ('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
        CONSTRAINT FK_ConfProp_Propietarios
            FOREIGN KEY (PropietarioId) REFERENCES dbo.Propietarios (Id)
            ON DELETE NO ACTION,
        CONSTRAINT FK_ConfProp_Monedas
            FOREIGN KEY (MonedaPredeterminadaCodigo) REFERENCES dbo.Monedas (Codigo)
            ON DELETE NO ACTION
    );
END;
GO

/* ==========================================================================================
   2. BACKFILL IDEMPOTENTE — Crea configuración base para propietarios ya existentes
      usando la moneda predeterminada del país del propietario.
   ========================================================================================== */
INSERT INTO dbo.ConfiguracionPropietario
    (PropietarioId, MonedaPredeterminadaCodigo, FormatoFecha, MostrarFinesDeSemanaPrimero)
SELECT
    p.Id,
    pa.MonedaDefaultCodigo,
    'DD/MM/YYYY',
    0
FROM dbo.Propietarios AS p
INNER JOIN dbo.Paises AS pa
    ON pa.Codigo = p.PaisCodigo
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.ConfiguracionPropietario AS cp
    WHERE cp.PropietarioId = p.Id
);
GO

/* ==========================================================================================
   3. AGENDAS — Agrega NombreComercial y banderas operativas (sin duplicar ZonaHoraria)
   ========================================================================================== */
IF COL_LENGTH(N'dbo.Agendas', N'NombreComercial') IS NULL
BEGIN
    ALTER TABLE dbo.Agendas
    ADD NombreComercial NVARCHAR(150) NULL;
END;
GO

IF COL_LENGTH(N'dbo.Agendas', N'ExigirAnticipoParaConfirmar') IS NULL
BEGIN
    ALTER TABLE dbo.Agendas
    ADD ExigirAnticipoParaConfirmar BIT NOT NULL
        CONSTRAINT DF_Agendas_ExigirAnticipoParaConfirmar DEFAULT (0);
END;
GO

IF COL_LENGTH(N'dbo.Agendas', N'PermitirTraslapes') IS NULL
BEGIN
    ALTER TABLE dbo.Agendas
    ADD PermitirTraslapes BIT NOT NULL
        CONSTRAINT DF_Agendas_PermitirTraslapes DEFAULT (0);
END;
GO

/* ==========================================================================================
   4. VERIFICACIÓN RÁPIDA
   ========================================================================================== */
SELECT
    cp.PropietarioId,
    cp.MonedaPredeterminadaCodigo,
    cp.FormatoFecha,
    cp.MostrarFinesDeSemanaPrimero,
    cp.FechaActualizacion
FROM dbo.ConfiguracionPropietario AS cp;

SELECT
    a.Id,
    a.Nombre,
    a.NombreComercial,
    a.MonedaCodigo,
    a.ZonaHoraria,
    a.ExigirAnticipoParaConfirmar,
    a.PermitirTraslapes
FROM dbo.Agendas AS a;
GO
