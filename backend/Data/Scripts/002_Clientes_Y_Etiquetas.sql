/* Clientes y etiquetas de cliente. Relaciones configuradas sin cascadas para evitar rutas múltiples. */
IF OBJECT_ID(N'dbo.Clientes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Clientes
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Clientes PRIMARY KEY,
        PropietarioId INT NOT NULL,
        NombreCompleto NVARCHAR(150) NOT NULL,
        TelefonoPaisCodigo CHAR(2) NOT NULL CONSTRAINT DF_Clientes_TelefonoPaisCodigo DEFAULT ('MX'),
        Telefono NVARCHAR(30) NOT NULL,
        Correo NVARCHAR(180) NULL,
        Direccion NVARCHAR(250) NULL,
        Notas NVARCHAR(500) NULL,
        Activo BIT NOT NULL CONSTRAINT DF_Clientes_Activo DEFAULT (1),
        FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Clientes_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion DATETIME2 NULL,
        CONSTRAINT FK_Clientes_Propietarios FOREIGN KEY (PropietarioId) REFERENCES dbo.Propietarios(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Clientes_TelefonoPais FOREIGN KEY (TelefonoPaisCodigo) REFERENCES dbo.Paises(Codigo) ON DELETE NO ACTION
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_Clientes_Propietario_Activo_Nombre' AND object_id=OBJECT_ID(N'dbo.Clientes'))
    CREATE INDEX IX_Clientes_Propietario_Activo_Nombre ON dbo.Clientes(PropietarioId, Activo, NombreCompleto);
GO

IF OBJECT_ID(N'dbo.EtiquetasCliente', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.EtiquetasCliente
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_EtiquetasCliente PRIMARY KEY,
        PropietarioId INT NOT NULL,
        Nombre NVARCHAR(60) NOT NULL,
        Descripcion NVARCHAR(200) NULL,
        Tono VARCHAR(20) NOT NULL CONSTRAINT DF_EtiquetasCliente_Tono DEFAULT ('neutral'),
        Activo BIT NOT NULL CONSTRAINT DF_EtiquetasCliente_Activo DEFAULT (1),
        FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_EtiquetasCliente_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT CK_EtiquetasCliente_Tono CHECK (Tono IN ('accent','success','warning','danger','info','neutral')),
        CONSTRAINT FK_EtiquetasCliente_Propietarios FOREIGN KEY (PropietarioId) REFERENCES dbo.Propietarios(Id) ON DELETE NO ACTION
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'UQ_EtiquetasCliente_Propietario_Nombre' AND object_id=OBJECT_ID(N'dbo.EtiquetasCliente'))
    CREATE UNIQUE INDEX UQ_EtiquetasCliente_Propietario_Nombre ON dbo.EtiquetasCliente(PropietarioId, Nombre);
GO

IF OBJECT_ID(N'dbo.ClienteEtiquetas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClienteEtiquetas
    (
        ClienteId INT NOT NULL,
        EtiquetaId INT NOT NULL,
        CONSTRAINT PK_ClienteEtiquetas PRIMARY KEY (ClienteId, EtiquetaId),
        CONSTRAINT FK_ClienteEtiquetas_Clientes FOREIGN KEY (ClienteId) REFERENCES dbo.Clientes(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_ClienteEtiquetas_EtiquetasCliente FOREIGN KEY (EtiquetaId) REFERENCES dbo.EtiquetasCliente(Id) ON DELETE NO ACTION
    );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name=N'IX_ClienteEtiquetas_EtiquetaId' AND object_id=OBJECT_ID(N'dbo.ClienteEtiquetas'))
    CREATE INDEX IX_ClienteEtiquetas_EtiquetaId ON dbo.ClienteEtiquetas(EtiquetaId);
GO
