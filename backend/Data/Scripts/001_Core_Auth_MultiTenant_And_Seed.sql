/* ==========================================================================================
   SCRIPT:   001_Core_Auth_MultiTenant_And_Seed.sql
   PROYECTO: ALAFE — Fase 1: Catálogos Base, Multi-Tenant, Auth JWT, RBAC y Agendas
   MOTOR:    Microsoft SQL Server (compatible con EF Core / .NET 10)

   ALCANCE DE ESTA PRIMERA CAPA (11 TABLAS)
   ------------------------------------------------------------------------------------------
   Catálogos globales:
     1. Monedas        → ISO 4217 (MXN, USD, EUR) y dónde está habilitada cada moneda.
     2. Paises         → ISO 3166-1 alpha-2 (MX, US) con lada telefónica y moneda base.
     3. Planes         → 3 niveles SaaS (Básico, Profesional, Empresarial) con límites y
                         módulos habilitados (NULL = ilimitado).
     4. Permisos       → Catálogo GLOBAL fijo de permisos granulares (<modulo>.<accion>).

   Núcleo SaaS Multi-Tenant y Seguridad JWT:
     5. Propietarios   → Tenant raíz, suscripción al plan, configuración general y teléfono.
     6. Roles          → Perfiles aislados por PropietarioId.
     7. RolPermisos    → Matriz N:M Rol ↔ Permiso.
     8. Usuarios       → Único login JWT (propietario titular + empleados) con teléfono.
     9. Agendas        → Negocios/espacios del propietario + ajustes propios y nota general.
    10. UsuarioAgendas → Acceso N:M de empleados a múltiples agendas del mismo propietario.
    11. RefreshTokens  → Renovación, revocación y soporte de "Recordarme" para JWT.

   PENDIENTE PARA FASE 2 (SCRIPT 002)
   ------------------------------------------------------------------------------------------
   · Clientes (con dirección estructurada + Latitud/Longitud opcionales para mapa de calor),
     Eventos (rangos completos + decoración + horas extra), Movimientos manuales
     (Efectivo / Transferencia) y TrazabilidadActividad.

   NOTAS PARA EL BACKEND (CAPA SERVICE)
   ------------------------------------------------------------------------------------------
   - Cero cascadas múltiples (Error 1785): todas las FKs usan ON DELETE NO ACTION, excepto
     RolPermisos (CASCADE).
   - Validación de límites del plan: al crear Agenda o Usuario, consultar dbo.Planes vía
     Propietarios.PlanId (si LimiteAgendas / LimiteUsuarios IS NULL → sin límite).
   - Validación de módulos del plan: si Plan.IncluyeMovimientos = 0, bloquear endpoints y
     ocultar módulo de Movimientos aunque el rol tenga permiso de administrador.
   - Normalización de teléfonos: guardar solo dígitos en Telefono (ej. '8671234567') junto
     con TelefonoPaisCodigo ('MX' o 'US').
   - Seed seguro: este script siembra SOLO catálogos globales. El alta de propietarios y el
     usuario demo se crean desde C# usando IPasswordHasher<Usuario> real.
   ========================================================================================== */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
GO

/* ==========================================================================================
   1. MONEDAS — Catálogo ISO 4217 (PK natural CHAR(3))
   ========================================================================================== */
IF OBJECT_ID(N'dbo.Monedas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Monedas
    (
        Codigo                   CHAR(3)      NOT NULL,
        Nombre                   NVARCHAR(50) NOT NULL,
        Simbolo                  NVARCHAR(5)  NOT NULL,
        HabilitadaEnAgenda       BIT          NOT NULL
            CONSTRAINT DF_Monedas_HabilitadaEnAgenda DEFAULT (0),
        HabilitadaEnMovimiento   BIT          NOT NULL
            CONSTRAINT DF_Monedas_HabilitadaEnMovimiento DEFAULT (1),
        Activo                   BIT          NOT NULL
            CONSTRAINT DF_Monedas_Activo DEFAULT (1),

        CONSTRAINT PK_Monedas PRIMARY KEY (Codigo)
    );
END;
GO

/* ==========================================================================================
   2. PAISES — Catálogo ISO 3166-1 alpha-2 (PK natural CHAR(2)) + lada telefónica
   ========================================================================================== */
IF OBJECT_ID(N'dbo.Paises', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Paises
    (
        Codigo              CHAR(2)      NOT NULL,
        Nombre              NVARCHAR(80) NOT NULL,
        CodigoLada          NVARCHAR(6)  NOT NULL,
        MonedaDefaultCodigo CHAR(3)      NOT NULL,
        Activo              BIT          NOT NULL
            CONSTRAINT DF_Paises_Activo DEFAULT (1),

        CONSTRAINT PK_Paises PRIMARY KEY (Codigo),
        CONSTRAINT UQ_Paises_Nombre UNIQUE (Nombre),
        CONSTRAINT FK_Paises_Monedas
            FOREIGN KEY (MonedaDefaultCodigo) REFERENCES dbo.Monedas (Codigo)
            ON DELETE NO ACTION
    );
END;
GO

/* ==========================================================================================
   3. PLANES — Catálogo de planes SaaS (página ficticia de suscripción y control de límites)
      · LimiteAgendas = NULL y LimiteUsuarios = NULL representan capacidad ILIMITADA.
      · IncluyeInventario se mantiene como característica de catálogo/UI en el plan superior.
   ========================================================================================== */
IF OBJECT_ID(N'dbo.Planes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Planes
    (
        Id                  INT             IDENTITY(1, 1) NOT NULL,
        Codigo              NVARCHAR(30)    NOT NULL,
        Nombre              NVARCHAR(60)    NOT NULL,
        Descripcion         NVARCHAR(250)   NULL,
        PrecioMensual       DECIMAL(10, 2)  NOT NULL,
        MonedaCodigo        CHAR(3)         NOT NULL
            CONSTRAINT DF_Planes_MonedaCodigo DEFAULT ('MXN'),
        LimiteAgendas       INT             NULL,
        LimiteUsuarios      INT             NULL,
        IncluyeMovimientos  BIT             NOT NULL
            CONSTRAINT DF_Planes_IncluyeMovimientos DEFAULT (0),
        IncluyeReportes     BIT             NOT NULL
            CONSTRAINT DF_Planes_IncluyeReportes DEFAULT (0),
        IncluyeInventario   BIT             NOT NULL
            CONSTRAINT DF_Planes_IncluyeInventario DEFAULT (0),
        OrdenVisual         INT             NOT NULL
            CONSTRAINT DF_Planes_OrdenVisual DEFAULT (1),
        Activo              BIT             NOT NULL
            CONSTRAINT DF_Planes_Activo DEFAULT (1),

        CONSTRAINT PK_Planes PRIMARY KEY (Id),
        CONSTRAINT UQ_Planes_Codigo UNIQUE (Codigo),
        CONSTRAINT UQ_Planes_Nombre UNIQUE (Nombre),
        CONSTRAINT CK_Planes_PrecioMensual CHECK (PrecioMensual >= 0),
        CONSTRAINT CK_Planes_LimiteAgendas CHECK (LimiteAgendas IS NULL OR LimiteAgendas >= 1),
        CONSTRAINT CK_Planes_LimiteUsuarios CHECK (LimiteUsuarios IS NULL OR LimiteUsuarios >= 1),
        CONSTRAINT FK_Planes_Monedas
            FOREIGN KEY (MonedaCodigo) REFERENCES dbo.Monedas (Codigo)
            ON DELETE NO ACTION
    );
END;
GO

/* ==========================================================================================
   4. PERMISOS — Catálogo GLOBAL de permisos granulares (<modulo>.<accion>)
   ========================================================================================== */
IF OBJECT_ID(N'dbo.Permisos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Permisos
    (
        Id          INT            IDENTITY(1, 1) NOT NULL,
        Clave       NVARCHAR(60)   NOT NULL,
        Modulo      NVARCHAR(40)   NOT NULL,
        Descripcion NVARCHAR(200)  NULL,

        CONSTRAINT PK_Permisos PRIMARY KEY (Id),
        CONSTRAINT UQ_Permisos_Clave UNIQUE (Clave)
    );
END;
GO

/* ==========================================================================================
   5. PROPIETARIOS — Tenant raíz, suscripción a un Plan, país/teléfono y configuración global
   ========================================================================================== */
IF OBJECT_ID(N'dbo.Propietarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Propietarios
    (
        Id                     INT            IDENTITY(1, 1) NOT NULL,
        PlanId                 INT            NOT NULL,
        NombreEspacioTrabajo   NVARCHAR(150)  NOT NULL,
        CorreoTitular          NVARCHAR(256)  NOT NULL,
        PaisCodigo             CHAR(2)        NOT NULL
            CONSTRAINT DF_Propietarios_PaisCodigo DEFAULT ('MX'),
        TelefonoPaisCodigo     CHAR(2)        NOT NULL
            CONSTRAINT DF_Propietarios_TelefonoPaisCodigo DEFAULT ('MX'),
        TelefonoContacto       NVARCHAR(20)   NOT NULL,
        -- Estado de suscripción simulada (sin pasarela de pagos)
        EstadoSuscripcion      NVARCHAR(20)   NOT NULL
            CONSTRAINT DF_Propietarios_EstadoSuscripcion DEFAULT (N'Activa'),
        FechaInicioSuscripcion DATETIME2(3)   NOT NULL
            CONSTRAINT DF_Propietarios_FechaInicioSuscripcion DEFAULT (SYSUTCDATETIME()),
        -- Control
        Activo                 BIT            NOT NULL
            CONSTRAINT DF_Propietarios_Activo DEFAULT (1),
        FechaCreacion          DATETIME2(3)   NOT NULL
            CONSTRAINT DF_Propietarios_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion     DATETIME2(3)   NULL,

        CONSTRAINT PK_Propietarios PRIMARY KEY (Id),
        CONSTRAINT CK_Propietarios_EstadoSuscripcion
            CHECK (EstadoSuscripcion IN (N'Activa', N'Prueba', N'Suspendida', N'Cancelada')),
        CONSTRAINT FK_Propietarios_Planes
            FOREIGN KEY (PlanId) REFERENCES dbo.Planes (Id)
            ON DELETE NO ACTION,
        CONSTRAINT FK_Propietarios_Paises
            FOREIGN KEY (PaisCodigo) REFERENCES dbo.Paises (Codigo)
            ON DELETE NO ACTION,
        CONSTRAINT FK_Propietarios_TelefonoPais
            FOREIGN KEY (TelefonoPaisCodigo) REFERENCES dbo.Paises (Codigo)
            ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Propietarios_PlanId'
                 AND object_id = OBJECT_ID(N'dbo.Propietarios'))
    CREATE INDEX IX_Propietarios_PlanId ON dbo.Propietarios (PlanId);
GO

/* ==========================================================================================
   6. ROLES — Perfiles aislados por PropietarioId
   ========================================================================================== */
IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles
    (
        Id                 INT            IDENTITY(1, 1) NOT NULL,
        PropietarioId      INT            NOT NULL,
        Nombre             NVARCHAR(50)   NOT NULL,
        Descripcion        NVARCHAR(200)  NULL,
        EsSistema          BIT            NOT NULL
            CONSTRAINT DF_Roles_EsSistema DEFAULT (0),
        Activo             BIT            NOT NULL
            CONSTRAINT DF_Roles_Activo DEFAULT (1),
        FechaCreacion      DATETIME2(3)   NOT NULL
            CONSTRAINT DF_Roles_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion DATETIME2(3)   NULL,

        CONSTRAINT PK_Roles PRIMARY KEY (Id),
        CONSTRAINT UQ_Roles_Propietario_Nombre UNIQUE (PropietarioId, Nombre),
        CONSTRAINT FK_Roles_Propietarios
            FOREIGN KEY (PropietarioId) REFERENCES dbo.Propietarios (Id)
            ON DELETE NO ACTION
    );
END;
GO

/* ==========================================================================================
   7. ROLPERMISOS — Matriz Rol ↔ Permiso (única tabla con ON DELETE CASCADE)
   ========================================================================================== */
IF OBJECT_ID(N'dbo.RolPermisos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolPermisos
    (
        RolId     INT NOT NULL,
        PermisoId INT NOT NULL,

        CONSTRAINT PK_RolPermisos PRIMARY KEY (RolId, PermisoId),
        CONSTRAINT FK_RolPermisos_Roles
            FOREIGN KEY (RolId) REFERENCES dbo.Roles (Id)
            ON DELETE CASCADE,
        CONSTRAINT FK_RolPermisos_Permisos
            FOREIGN KEY (PermisoId) REFERENCES dbo.Permisos (Id)
            ON DELETE CASCADE
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_RolPermisos_PermisoId'
                 AND object_id = OBJECT_ID(N'dbo.RolPermisos'))
    CREATE INDEX IX_RolPermisos_PermisoId ON dbo.RolPermisos (PermisoId);
GO

/* ==========================================================================================
   8. USUARIOS — Propietario titular y empleados en una única tabla de login JWT
   ========================================================================================== */
IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios
    (
        Id                 INT            IDENTITY(1, 1) NOT NULL,
        PropietarioId      INT            NOT NULL,
        RolId              INT            NOT NULL,
        NombreCompleto     NVARCHAR(150)  NOT NULL,
        Correo             NVARCHAR(256)  NOT NULL,
        TelefonoPaisCodigo CHAR(2)        NOT NULL
            CONSTRAINT DF_Usuarios_TelefonoPaisCodigo DEFAULT ('MX'),
        Telefono           NVARCHAR(20)   NOT NULL,
        PasswordHash       NVARCHAR(512)  NOT NULL,
        EsPropietario      BIT            NOT NULL
            CONSTRAINT DF_Usuarios_EsPropietario DEFAULT (0),
        TokenVersion       INT            NOT NULL
            CONSTRAINT DF_Usuarios_TokenVersion DEFAULT (1),
        Activo             BIT            NOT NULL
            CONSTRAINT DF_Usuarios_Activo DEFAULT (1),
        UltimoAcceso       DATETIME2(3)   NULL,
        -- Preferencias personales de interfaz
        TemaVisual         NVARCHAR(20)   NOT NULL
            CONSTRAINT DF_Usuarios_TemaVisual DEFAULT (N'claro'),
        VistaAgendaDefault NVARCHAR(10)   NOT NULL
            CONSTRAINT DF_Usuarios_VistaAgendaDefault DEFAULT (N'mes'),
        -- Auditoría
        FechaCreacion      DATETIME2(3)   NOT NULL
            CONSTRAINT DF_Usuarios_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion DATETIME2(3)   NULL,

        CONSTRAINT PK_Usuarios PRIMARY KEY (Id),
        CONSTRAINT UQ_Usuarios_Correo UNIQUE (Correo),
        CONSTRAINT CK_Usuarios_TokenVersion CHECK (TokenVersion >= 1),
        CONSTRAINT CK_Usuarios_TemaVisual CHECK (TemaVisual IN (N'claro', N'oscuro')),
        CONSTRAINT CK_Usuarios_VistaAgendaDefault CHECK (VistaAgendaDefault IN (N'mes', N'lista')),
        CONSTRAINT FK_Usuarios_Propietarios
            FOREIGN KEY (PropietarioId) REFERENCES dbo.Propietarios (Id)
            ON DELETE NO ACTION,
        CONSTRAINT FK_Usuarios_Roles
            FOREIGN KEY (RolId) REFERENCES dbo.Roles (Id)
            ON DELETE NO ACTION,
        CONSTRAINT FK_Usuarios_TelefonoPais
            FOREIGN KEY (TelefonoPaisCodigo) REFERENCES dbo.Paises (Codigo)
            ON DELETE NO ACTION
    );
END;

-- Garantiza máximo un usuario titular (EsPropietario = 1) por cada PropietarioId
IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'UQ_Usuarios_TitularPorPropietario'
                 AND object_id = OBJECT_ID(N'dbo.Usuarios'))
    CREATE UNIQUE INDEX UQ_Usuarios_TitularPorPropietario
        ON dbo.Usuarios (PropietarioId)
        WHERE EsPropietario = 1;

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Usuarios_PropietarioId'
                 AND object_id = OBJECT_ID(N'dbo.Usuarios'))
    CREATE INDEX IX_Usuarios_PropietarioId ON dbo.Usuarios (PropietarioId, Activo);

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Usuarios_RolId'
                 AND object_id = OBJECT_ID(N'dbo.Usuarios'))
    CREATE INDEX IX_Usuarios_RolId ON dbo.Usuarios (RolId);
GO

/* ==========================================================================================
   9. AGENDAS — Negocios/espacios del propietario + configuración propia y nota general
   ========================================================================================== */
IF OBJECT_ID(N'dbo.Agendas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Agendas
    (
        Id                       INT            IDENTITY(1, 1) NOT NULL,
        PropietarioId            INT            NOT NULL,
        Nombre                   NVARCHAR(150)  NOT NULL,
        MonedaCodigo             CHAR(3)        NOT NULL
            CONSTRAINT DF_Agendas_MonedaCodigo DEFAULT ('MXN'),
        ZonaHoraria              NVARCHAR(64)   NOT NULL
            CONSTRAINT DF_Agendas_ZonaHoraria DEFAULT (N'America/Matamoros'),
        NombreEventoDefault      NVARCHAR(150)  NOT NULL
            CONSTRAINT DF_Agendas_NombreEventoDefault DEFAULT (N'Evento'),
        -- Nota general compartida (visible en Agenda, editable en Configuración → Por agenda)
        MostrarNotaGeneral       BIT            NOT NULL
            CONSTRAINT DF_Agendas_MostrarNotaGeneral DEFAULT (0),
        NotaGeneral              NVARCHAR(1000) NULL,
        NotaGeneralActualizadaEn DATETIME2(3)   NULL,
        NotaGeneralUsuarioId     INT            NULL,
        -- Datos de contacto y horario base opcionales
        TelefonoPaisCodigo       CHAR(2)        NULL,
        TelefonoContacto         NVARCHAR(20)   NULL,
        DireccionNegocio         NVARCHAR(200)  NULL,
        HoraAperturaDefault      TIME(0)        NOT NULL
            CONSTRAINT DF_Agendas_HoraAperturaDefault DEFAULT ('09:00'),
        HoraCierreDefault        TIME(0)        NOT NULL
            CONSTRAINT DF_Agendas_HoraCierreDefault DEFAULT ('22:00'),
        -- Control
        Activo                   BIT            NOT NULL
            CONSTRAINT DF_Agendas_Activo DEFAULT (1),
        FechaCreacion            DATETIME2(3)   NOT NULL
            CONSTRAINT DF_Agendas_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        FechaActualizacion       DATETIME2(3)   NULL,

        CONSTRAINT PK_Agendas PRIMARY KEY (Id),
        CONSTRAINT UQ_Agendas_Propietario_Nombre UNIQUE (PropietarioId, Nombre),
        CONSTRAINT CK_Agendas_Horario CHECK (HoraCierreDefault > HoraAperturaDefault),
        CONSTRAINT CK_Agendas_TelefonoPar
            CHECK (
                (TelefonoPaisCodigo IS NULL AND TelefonoContacto IS NULL)
                OR
                (TelefonoPaisCodigo IS NOT NULL AND TelefonoContacto IS NOT NULL)
            ),
        CONSTRAINT FK_Agendas_Propietarios
            FOREIGN KEY (PropietarioId) REFERENCES dbo.Propietarios (Id)
            ON DELETE NO ACTION,
        CONSTRAINT FK_Agendas_Monedas
            FOREIGN KEY (MonedaCodigo) REFERENCES dbo.Monedas (Codigo)
            ON DELETE NO ACTION,
        CONSTRAINT FK_Agendas_TelefonoPais
            FOREIGN KEY (TelefonoPaisCodigo) REFERENCES dbo.Paises (Codigo)
            ON DELETE NO ACTION,
        CONSTRAINT FK_Agendas_NotaGeneralUsuario
            FOREIGN KEY (NotaGeneralUsuarioId) REFERENCES dbo.Usuarios (Id)
            ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_Agendas_PropietarioId'
                 AND object_id = OBJECT_ID(N'dbo.Agendas'))
    CREATE INDEX IX_Agendas_PropietarioId ON dbo.Agendas (PropietarioId, Activo);
GO

/* ==========================================================================================
   10. USUARIOAGENDAS — Relación N:M para empleados con acceso a una o varias agendas
       Nota: el usuario con EsPropietario = 1 tiene acceso implícito a todas las agendas
             de su PropietarioId desde la capa de autorización.
   ========================================================================================== */
IF OBJECT_ID(N'dbo.UsuarioAgendas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UsuarioAgendas
    (
        UsuarioId       INT          NOT NULL,
        AgendaId        INT          NOT NULL,
        FechaAsignacion DATETIME2(3) NOT NULL
            CONSTRAINT DF_UsuarioAgendas_FechaAsignacion DEFAULT (SYSUTCDATETIME()),

        CONSTRAINT PK_UsuarioAgendas PRIMARY KEY (UsuarioId, AgendaId),
        CONSTRAINT FK_UsuarioAgendas_Usuarios
            FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuarios (Id)
            ON DELETE NO ACTION,
        CONSTRAINT FK_UsuarioAgendas_Agendas
            FOREIGN KEY (AgendaId) REFERENCES dbo.Agendas (Id)
            ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_UsuarioAgendas_AgendaId'
                 AND object_id = OBJECT_ID(N'dbo.UsuarioAgendas'))
    CREATE INDEX IX_UsuarioAgendas_AgendaId ON dbo.UsuarioAgendas (AgendaId);
GO

/* ==========================================================================================
   11. REFRESHTOKENS — Renovación, revocación y soporte para "Recordarme"
   ========================================================================================== */
IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefreshTokens
    (
        Id                      INT            IDENTITY(1, 1) NOT NULL,
        UsuarioId               INT            NOT NULL,
        TokenHash               NVARCHAR(128)  NOT NULL,
        Recordarme              BIT            NOT NULL
            CONSTRAINT DF_RefreshTokens_Recordarme DEFAULT (0),
        ExpiraEn                DATETIME2(3)   NOT NULL,
        CreadoEn                DATETIME2(3)   NOT NULL
            CONSTRAINT DF_RefreshTokens_CreadoEn DEFAULT (SYSUTCDATETIME()),
        RevocadoEn              DATETIME2(3)   NULL,
        ReemplazadoPorTokenHash NVARCHAR(128)  NULL,
        IpCreacion              NVARCHAR(45)   NULL,
        UserAgent               NVARCHAR(256)  NULL,

        CONSTRAINT PK_RefreshTokens PRIMARY KEY (Id),
        CONSTRAINT UQ_RefreshTokens_TokenHash UNIQUE (TokenHash),
        CONSTRAINT FK_RefreshTokens_Usuarios
            FOREIGN KEY (UsuarioId) REFERENCES dbo.Usuarios (Id)
            ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_RefreshTokens_Usuario_Activos'
                 AND object_id = OBJECT_ID(N'dbo.RefreshTokens'))
    CREATE INDEX IX_RefreshTokens_Usuario_Activos
        ON dbo.RefreshTokens (UsuarioId, ExpiraEn)
        WHERE RevocadoEn IS NULL;
GO

/* ==========================================================================================
   12. SEED IDEMPOTENTE — Catálogos Globales (Monedas, Países, Planes y Permisos)
   ========================================================================================== */

-- 12.1 Monedas
MERGE dbo.Monedas AS target
USING (VALUES
    ('MXN', N'Peso mexicano',        N'$', 1, 1, 1),
    ('USD', N'Dólar estadounidense', N'$', 1, 1, 1),
    ('EUR', N'Euro',                 N'€', 0, 1, 1)
) AS source (Codigo, Nombre, Simbolo, HabilitadaEnAgenda, HabilitadaEnMovimiento, Activo)
ON target.Codigo = source.Codigo
WHEN MATCHED THEN
    UPDATE SET
        target.Nombre                 = source.Nombre,
        target.Simbolo                = source.Simbolo,
        target.HabilitadaEnAgenda     = source.HabilitadaEnAgenda,
        target.HabilitadaEnMovimiento = source.HabilitadaEnMovimiento,
        target.Activo                 = source.Activo
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Codigo, Nombre, Simbolo, HabilitadaEnAgenda, HabilitadaEnMovimiento, Activo)
    VALUES (source.Codigo, source.Nombre, source.Simbolo, source.HabilitadaEnAgenda, source.HabilitadaEnMovimiento, source.Activo);
GO

-- 12.2 Países (México y Estados Unidos)
MERGE dbo.Paises AS target
USING (VALUES
    ('MX', N'México',         N'+52', 'MXN', 1),
    ('US', N'Estados Unidos', N'+1',  'USD', 1)
) AS source (Codigo, Nombre, CodigoLada, MonedaDefaultCodigo, Activo)
ON target.Codigo = source.Codigo
WHEN MATCHED THEN
    UPDATE SET
        target.Nombre              = source.Nombre,
        target.CodigoLada          = source.CodigoLada,
        target.MonedaDefaultCodigo = source.MonedaDefaultCodigo,
        target.Activo              = source.Activo
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Codigo, Nombre, CodigoLada, MonedaDefaultCodigo, Activo)
    VALUES (source.Codigo, source.Nombre, source.CodigoLada, source.MonedaDefaultCodigo, source.Activo);
GO

-- 12.3 Planes SaaS (precios de ejemplo editables para la página ficticia de contratación)
MERGE dbo.Planes AS target
USING (VALUES
    (N'BASICO',      N'Básico',      N'Ideal para un solo espacio: 1 agenda y hasta 3 usuarios.',                             299.00, 'MXN', 1,    3,    0, 0, 0, 1, 1),
    (N'PROFESIONAL', N'Profesional', N'Para negocios en crecimiento: hasta 3 agendas, 15 usuarios y módulo de movimientos.',  599.00, 'MXN', 3,    15,   1, 0, 0, 2, 1),
    (N'EMPRESARIAL', N'Empresarial', N'Sin límites: agendas y usuarios ilimitados, todos los módulos e inventario.',          999.00, 'MXN', NULL, NULL, 1, 1, 1, 3, 1)
) AS source (
    Codigo, Nombre, Descripcion, PrecioMensual, MonedaCodigo,
    LimiteAgendas, LimiteUsuarios, IncluyeMovimientos, IncluyeReportes, IncluyeInventario,
    OrdenVisual, Activo
)
ON target.Codigo = source.Codigo
WHEN MATCHED THEN
    UPDATE SET
        target.Nombre             = source.Nombre,
        target.Descripcion        = source.Descripcion,
        target.PrecioMensual      = source.PrecioMensual,
        target.MonedaCodigo       = source.MonedaCodigo,
        target.LimiteAgendas      = source.LimiteAgendas,
        target.LimiteUsuarios     = source.LimiteUsuarios,
        target.IncluyeMovimientos = source.IncluyeMovimientos,
        target.IncluyeReportes    = source.IncluyeReportes,
        target.IncluyeInventario  = source.IncluyeInventario,
        target.OrdenVisual        = source.OrdenVisual,
        target.Activo             = source.Activo
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        Codigo, Nombre, Descripcion, PrecioMensual, MonedaCodigo,
        LimiteAgendas, LimiteUsuarios, IncluyeMovimientos, IncluyeReportes, IncluyeInventario,
        OrdenVisual, Activo
    )
    VALUES (
        source.Codigo, source.Nombre, source.Descripcion, source.PrecioMensual, source.MonedaCodigo,
        source.LimiteAgendas, source.LimiteUsuarios, source.IncluyeMovimientos, source.IncluyeReportes, source.IncluyeInventario,
        source.OrdenVisual, source.Activo
    );
GO

-- 12.4 Permisos globales base (11 permisos)
MERGE dbo.Permisos AS target
USING (VALUES
    -- Agenda / Eventos
    (N'eventos.consultar',    N'Eventos',       N'Consultar agenda, disponibilidad y detalle de eventos.'),
    (N'eventos.crear',        N'Eventos',       N'Agendar nuevos eventos en las agendas asignadas.'),
    (N'eventos.editar',       N'Eventos',       N'Editar horarios, notas y datos de un evento.'),
    (N'eventos.eliminar',     N'Eventos',       N'Cancelar o eliminar eventos.'),
    -- Clientes
    (N'clientes.consultar',   N'Clientes',      N'Buscar y consultar la cartera de clientes del espacio de trabajo.'),
    (N'clientes.gestionar',   N'Clientes',      N'Registrar, editar y desactivar clientes.'),
    -- Usuarios y permisos
    (N'usuarios.administrar', N'Usuarios',      N'Crear, editar, asignar agendas y activar/desactivar usuarios.'),
    (N'permisos.administrar', N'Usuarios',      N'Administrar roles y su matriz de permisos por propietario.'),
    -- Configuración y agendas
    (N'agendas.administrar',  N'Configuracion', N'Crear, renombrar y desactivar agendas del propietario.'),
    (N'config.agenda.editar', N'Configuracion', N'Editar moneda, nombre predeterminado y nota general de cada agenda.'),
    (N'config.cuenta.editar', N'Configuracion', N'Editar la configuración general del espacio de trabajo y suscripción.')
) AS source (Clave, Modulo, Descripcion)
ON target.Clave = source.Clave
WHEN MATCHED AND (target.Modulo <> source.Modulo OR ISNULL(target.Descripcion, N'') <> ISNULL(source.Descripcion, N'')) THEN
    UPDATE SET
        target.Modulo      = source.Modulo,
        target.Descripcion = source.Descripcion
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Clave, Modulo, Descripcion)
    VALUES (source.Clave, source.Modulo, source.Descripcion);
GO

/* ==========================================================================================
   13. VERIFICACIÓN RÁPIDA (esperado: 11 tablas, 3 monedas, 2 países, 3 planes, 11 permisos)
   ========================================================================================== */
SELECT t.name AS Tabla
FROM sys.tables AS t
WHERE t.schema_id = SCHEMA_ID(N'dbo')
ORDER BY t.name;

SELECT Codigo, Nombre, PrecioMensual, MonedaCodigo, LimiteAgendas, LimiteUsuarios,
       IncluyeMovimientos, IncluyeReportes, IncluyeInventario
FROM dbo.Planes
ORDER BY OrdenVisual;
GO