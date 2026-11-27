Necesito diseñar e implementar únicamente el esquema de base de datos en SQL Server para el módulo de autenticación JWT, alta de usuarios, roles y permisos (RBAC).

Antes de crear archivos, inspecciona la estructura actual del backend (carpetas, DbContext, entidades existentes, convenciones de nombres y scripts SQL/migraciones) para respetar el estilo y arquitectura del proyecto. Puedes apoyarte de la lógica del proyecto conocida, documentada, del frontend, recomendaciones y buenas practicas de diseño de una bd. 

### Alcance de las tablas requeridas

EL diseño siguiente no es algo forzoso hacer, puedes mejorarlo de acuerdo a la arquitectura conocida, documentada, reglas de negocio, necesidades pero sin sesgarse.
Crea un esquema normalizado con las siguientes tablas:
1. `Roles`: Id, Nombre (UNIQUE), Descripcion, Activo (BIT DEFAULT 1), FechaCreacion, FechaModificacion.
2. `Permisos`: Id, Clave (UNIQUE, formato `modulo.accion`, ej. `usuarios.crear`, `clientes.ver`, `agenda.editar`), Modulo, Nombre, Descripcion, Activo.
3. `RolPermisos`: tabla intermedia con PK compuesta (`RolId`, `PermisoId`) y FKs hacia `Roles` y `Permisos`.
4. `Usuarios`: Id, NombreCompleto, Email (UNIQUE), Username (UNIQUE, opcional si el login es por email), PasswordHash (NVARCHAR(255) para hash seguro, nunca texto plano), Activo (BIT DEFAULT 1), UltimoAcceso, FechaCreacion, FechaModificacion.
5. `UsuarioRoles`: tabla intermedia con PK compuesta (`UsuarioId`, `RolId`) y FKs hacia `Usuarios` y `Roles`.
6. `RefreshTokens`: Id, UsuarioId (FK a `Usuarios`), TokenHash (NVARCHAR(255), UNIQUE), ExpiraEn, CreadoEn, RevocadoEn (NULL), ReemplazadoPorTokenHash (NULL), IpCreacion (NVARCHAR(45) NULL), para soportar renovación y revocación de sesiones JWT.

### Reglas técnicas para SQL Server
- Usa `DATETIME2` o `DATETIMEOFFSET` en UTC para todas las fechas (no uses `DATETIME`).
- Nombra explícitamente todas las restricciones (`PK_`, `FK_`, `UQ_`, `DF_`) y agrega índices (`IX_`) en llaves foráneas y campos de consulta frecuente (`Email`, `Clave`, `TokenHash`, `UsuarioId`).
- Evita `ON DELETE CASCADE` en relaciones críticas de auditoría o usuarios; prioriza borrado lógico con `Activo`.
- Si entregas script `.sql`, hazlo idempotente (`IF OBJECT_ID(...) IS NULL`) para poder ejecutarlo sin errores repetidas veces.
- Incluye un script de datos semilla (`SEED`) idempotente con al menos un rol `Administrador` y un conjunto inicial de permisos agrupados por los módulos existentes del proyecto (sin hardcodear contraseñas en texto plano).
- Considerar el tema de las zonas horarias especificadas en el otro archivo llamado "arquitectura-zonas-horarias".


# Contexto(como guía no es fija)

Funcionamiento básico de nuestra lógica relacional. Para definir la idea del negocio del proeycto.

## Propietario ([[Propietario]]) 

Es un usuario con rol de propietario o administrador. Pero estaría bien identificar quien es el propietario el que podría pagar el servicio o la subscripcion. ya que puede haber varios administradores en el espacio de trabajo del sistema.
Un propietario puede tener varias agendas como si fueran un negocio independiente cada una.
## Agenda ([[Agenda]])

Una agenda hay que verla como si fuera un negocio independiente de un propietario. En esta nos apoyara mucho identificarla para registrar los **eventos**
## Cliente ([[Cliente]])

Un cliente cuando se registre en cualquier agenda su relación será de **Propietario** --> **Cliente**. Es decir un cliente no pertenece a un negocio sino a un propietario. Aunque se guardara registro único de cuándo tuvo contacto por primera vez en cada negocio.
## Evento ([[Evento]])

Un evento le pertenece a un **cliente** y a una **agenda**.
# Usuario

Uso del SaSS



### Entregables y límites
- Genera el script SQL de creación + script de seed en la carpeta correspondiente del proyecto (y, si el backend usa Entity Framework Core, crea también las entidades, sus configuraciones Fluent API y la migración sin romper el build actual).
- NO implementes todavía los endpoints, controladores ni la lógica de generación de JWT; enfócate únicamente en la capa de base de datos y persistencia.
- Al finalizar, dame un resumen breve de las tablas creadas, sus relaciones, los índices agregados y cualquier supuesto que hayas tomado.
