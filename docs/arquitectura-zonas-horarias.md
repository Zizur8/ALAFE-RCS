# Zonas horarias: regla de arquitectura para ALAFE

**Estado:** decisión documentada; lista para implementación con Entity Framework Core (.NET 10).  
**Ámbito:** agendas, eventos, auditoría, API ASP.NET Core, Entity Framework Core, SQL Server y frontend React.

## Decisión

La pantalla de **Configuración** no expone un selector de zona horaria en la operación diaria. Esto evita que un administrador cambie accidentalmente el contexto temporal de reservas ya registradas. Cada agenda configura su propia zona horaria IANA; `America/Matamoros` es el valor fallback predeterminado del sistema. Todas las fechas técnicas y de auditoría se persisten en UTC.

La zona horaria tampoco debe quedar escrita directamente en controladores, servicios o componentes. ALAFE usa una zona predeterminada configurable en servidor y, al operar como SaaS con múltiples clientes y sedes, cada agenda almacena su propia zona IANA. El valor inicial recomendado es:

```text
America/Matamoros
```

Este identificador IANA representa la franja fronteriza de Tamaulipas y mantiene las reglas de horario estacional correspondientes. No debe sustituirse por `America/Monterrey` ni por `America/Mexico_City`, porque esas zonas siguen reglas distintas.

## Motivo y límite de la decisión

`America/Matamoros` resuelve correctamente el caso inicial en la frontera norte, pero no es un estándar universal para todas las ciudades donde operará ALAFE. Cada agenda ubicada en otro estado o país debe conservar su propia zona IANA; de otro modo, sus reservas se desplazarán una hora durante parte del año.

La propuesta de producto “Donde sea, cuando sea” exige que la zona sea un dato de configuración del servidor y de cada agenda, aunque permanezca oculto en la interfaz operativa habitual.

## Propiedad y prioridad del dato

| Nivel | Dato | Uso |
|---|---|---|
| Servidor | `Time:DefaultTimeZone` | Valor inicial para una agenda que todavía no tiene zona definida. |
| Agenda/sede | `ZonaHorariaIana` | Fuente de verdad para interpretar, convertir y mostrar los horarios de sus eventos. |
| Evento (operación) | `InicioUtc` y `FinUtc` | Fuente de verdad inmutable en la línea de tiempo para ordenar, auditar y detectar empalmes. |
| Evento (comercial) | `InicioLocal` y `FinLocal` | Respaldo de la hora local pactada con el cliente ante posibles cambios legales de horario estacional. |
| Usuario/navegador | Zona local del dispositivo | No cambia la agenda ni se usa para reinterpretar reservas. |

La API aplica, en este orden: zona de la agenda, valor predeterminado del servidor y finalmente error de configuración si no existe ninguno. El frontend recibe también la zona de la agenda para formatear resultados.

## Configuración del backend y entorno (.NET 10)

Agregar esta sección a `backend/appsettings.json` y `backend/appsettings.Example.json`:

```json
"Time": {
  "DefaultTimeZone": "America/Matamoros"
}
```

Registrar la configuración mediante opciones tipadas en `Program.cs` (evitando lecturas dispersas con `configuration["Time:DefaultTimeZone"]`):

```csharp
public sealed class TimeOptions
{
    public const string SectionName = "Time";
    public string DefaultTimeZone { get; init; } = "America/Matamoros";
}

builder.Services
    .AddOptions<TimeOptions>()
    .Bind(builder.Configuration.GetSection(TimeOptions.SectionName))
    .Validate(o => !string.IsNullOrWhiteSpace(o.DefaultTimeZone),
        "Time:DefaultTimeZone es obligatorio.")
    .ValidateOnStart();
```

**Compatibilidad IANA en despliegue:** Desde .NET 6 en adelante (incluido .NET 10), `TimeZoneInfo.FindSystemTimeZoneById("America/Matamoros")` resuelve identificadores IANA de forma nativa tanto en Linux como en Windows sin bibliotecas externas. Si el despliegue utiliza contenedores **Docker Alpine**, la imagen debe incluir los paquetes `icu-libs` y `tzdata` para garantizar la resolución de zonas horarias. Nunca almacenar ni devolver IDs de Windows en la API.

## Regla para auditoría y logs

Los instantes técnicos se guardan y transportan siempre en UTC:

```csharp
var creadoEnUtc = DateTime.UtcNow;
var actualizadoEnUtc = DateTime.UtcNow;
```

El esquema actual ya sigue esta regla en `backend/Data/Scripts/001_Initial_Schema_And_Seed.sql`: `Usuarios.FechaCreacion`, `Clientes.FechaRegistro`, `Eventos.FechaCreacion` y `Configuracion.FechaActualizacion` utilizan `SYSUTCDATETIME()`.

Los DTOs de auditoría deben serializar en formato ISO 8601 con sufijo `Z` (por ejemplo, `2026-11-25T21:40:00.000Z`). La UI convierte únicamente para presentación usando la zona de la agenda:

```ts
export function formatActivity(isoUtc: string, timeZone: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(isoUtc))
}
```

El texto relativo, como “hace 20 min”, se calcula contra `Date.now()` usando el instante UTC y no depende del huso horario del navegador.

## Regla para Entity Framework Core y serialización JSON

En SQL Server, las columnas `DATETIME2` no almacenan zona horaria; al materializarlas con Entity Framework Core, llegan como `DateTime` con `DateTimeKind.Unspecified`. Si `System.Text.Json` serializa un `DateTime` sin `Kind.Utc`, **omite la `Z` final** y el navegador lo interpreta erróneamente en la hora local del usuario.

Para evitar este defecto silencioso en todo el proyecto:

1. Definir un `ValueConverter` reutilizable exclusivamente para propiedades UTC (no aplicarlo de forma ciega sobre `InicioLocal` y `FinLocal`):

```csharp
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

public sealed class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
    toDb => toDb.Kind == DateTimeKind.Utc
        ? toDb
        : DateTime.SpecifyKind(toDb, DateTimeKind.Utc),
    fromDb => DateTime.SpecifyKind(fromDb, DateTimeKind.Utc));
```

2. Aplicarlo en las clases `IEntityTypeConfiguration<T>` (o en `OnModelCreating` para todas las columnas de auditoría y campos `*Utc`):

```csharp
public sealed class EventoConfiguration : IEntityTypeConfiguration<Evento>
{
    public void Configure(EntityTypeBuilder<Evento> builder)
    {
        var utcConverter = new UtcDateTimeConverter();

        builder.Property(e => e.InicioUtc)
            .HasColumnType("datetime2(3)")
            .HasConversion(utcConverter);

        builder.Property(e => e.FinUtc)
            .HasColumnType("datetime2(3)")
            .HasConversion(utcConverter);

        builder.Property(e => e.FechaCreacion)
            .HasColumnType("datetime2(3)")
            .HasConversion(utcConverter);

        builder.Property(e => e.InicioLocal)
            .HasColumnType("datetime2(0)");

        builder.Property(e => e.FinLocal)
            .HasColumnType("datetime2(0)");

        builder.HasIndex(e => new { e.AgendaId, e.InicioUtc, e.FinUtc })
            .HasDatabaseName("IX_Eventos_Agenda_Intervalo");
    }
}
```

3. En DTOs de respuesta, exponer los instantes UTC como `DateTimeOffset` (normalizado en UTC) o `DateTime` garantizado con `DateTimeKind.Utc`, asegurando siempre la salida con sufijo `Z`.

## Regla para reservas y eventos

Una reserva no depende de la zona horaria del servidor ni del dispositivo del operador. La API recibe la fecha y hora comercial elegida junto con `agendaId`, consulta la `ZonaHorariaIana` de la agenda, valida el intervalo y calcula los instantes UTC antes de persistir.

Contrato de creación propuesto:

```json
{
  "agendaId": 14,
  "inicioLocal": "2026-11-25T14:00:00",
  "finLocal": "2026-11-25T21:00:00"
}
```

El cliente nunca envía `Z` en `inicioLocal` ni `finLocal`, porque representan la hora comercial del recinto.

Servicio de conversión propuesto en ASP.NET Core:

```csharp
public sealed class AgendaTimeService
{
    public (DateTime InicioUtc, DateTime FinUtc) ToUtc(
        DateTime inicioLocal,
        DateTime finLocal,
        string zonaHorariaIana)
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(zonaHorariaIana);
        var inicio = DateTime.SpecifyKind(inicioLocal, DateTimeKind.Unspecified);
        var fin = DateTime.SpecifyKind(finLocal, DateTimeKind.Unspecified);

        if (zone.IsInvalidTime(inicio) || zone.IsInvalidTime(fin))
            throw new ValidationException("El horario elegido no existe por el cambio de horario estacional.");

        // Si la hora de inicio es ambigua (retraso de reloj), se exige confirmación explícita.
        if (zone.IsAmbiguousTime(inicio))
            throw new ValidationException("La hora de inicio es ambigua por el cambio de horario. Confirma el horario.");

        var inicioUtcOffset = new DateTimeOffset(inicio, zone.GetUtcOffset(inicio)).ToUniversalTime();

        DateTimeOffset finUtcOffset;
        if (zone.IsAmbiguousTime(fin))
        {
            // En eventos nocturnos que cruzan el atraso de reloj, se toma la primera ocurrencia posterior al inicio.
            finUtcOffset = zone.GetAmbiguousTimeOffsets(fin)
                .Select(offset => new DateTimeOffset(fin, offset).ToUniversalTime())
                .OrderBy(dt => dt)
                .FirstOrDefault(dt => dt > inicioUtcOffset);

            if (finUtcOffset == default)
                throw new ValidationException("La hora de fin debe ser posterior a la hora de inicio.");
        }
        else
        {
            finUtcOffset = new DateTimeOffset(fin, zone.GetUtcOffset(fin)).ToUniversalTime();
        }

        if (finUtcOffset <= inicioUtcOffset)
            throw new ValidationException("La hora de fin debe ser posterior a la hora de inicio.");

        return (inicioUtcOffset.UtcDateTime, finUtcOffset.UtcDateTime);
    }
}
```

La validación de empalmes compara exclusivamente `InicioUtc` y `FinUtc` dentro de la misma agenda con intervalos semiabiertos `[InicioUtc, FinUtc)`: una reserva que termina a las 14:00 no se empalma con otra que inicia a las 14:00.

## Modelo de datos objetivo

El esquema SQL inicial usa `FechaEvento`, `HoraInicio` y `HoraFin` en `Eventos`, lo cual impide modelar eventos que cruzan medianoche y desacoplar zonas horarias por sede.

La migración de EF Core deberá introducir, como mínimo:

```sql
CREATE TABLE dbo.Agendas (
    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    EmpresaId INT NOT NULL,
    Nombre NVARCHAR(120) NOT NULL,
    ZonaHorariaIana NVARCHAR(64) NOT NULL
        CONSTRAINT DF_Agendas_ZonaHorariaIana DEFAULT (N'America/Matamoros')
);

ALTER TABLE dbo.Eventos ADD AgendaId INT NULL;
ALTER TABLE dbo.Eventos ADD InicioUtc DATETIME2(3) NULL;
ALTER TABLE dbo.Eventos ADD FinUtc DATETIME2(3) NULL;
ALTER TABLE dbo.Eventos ADD InicioLocal DATETIME2(0) NULL;
ALTER TABLE dbo.Eventos ADD FinLocal DATETIME2(0) NULL;
```

Tras asignar la agenda inicial y migrar los registros existentes, `AgendaId`, `InicioUtc`, `FinUtc`, `InicioLocal` y `FinLocal` pasarán a `NOT NULL`. Índice operativo requerido:

```sql
CREATE INDEX IX_Eventos_Agenda_Intervalo
ON dbo.Eventos (AgendaId, InicioUtc, FinUtc);
```

Conservar `InicioLocal` y `FinLocal` junto a `ZonaHorariaIana` permite recalcular `InicioUtc` y `FinUtc` mediante un proceso de mantenimiento si un gobierno modifica las reglas futuras de horario de verano, sin alterar la hora pactada con el cliente ni perder el rendimiento de consultas e índices en UTC.

## React: captura y presentación

Los campos actuales separan fecha (`YYYY-MM-DD`) y hora (`HH:mm`). Al enviarlos a la API, deben serializarse como fecha local sin sufijo de zona:

```ts
const inicioLocal = `${form.startDate}T${form.start}:00`
const finLocal = `${form.endDate}T${form.end}:00`
```

No convertir estos valores con `new Date(inicioLocal).toISOString()` antes de enviarlos, ya que esa operación usa el huso horario del navegador y puede desplazar la reserva.

Para mostrar una fecha recibida en UTC desde la API:

```ts
const formatEventTime = (inicioUtc: string, timeZone: string) =>
  new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(inicioUtc))
```

El frontend recibe `agenda.timeZone` desde el endpoint de agenda o la sesión y lo usa únicamente para formateo visual.

## Plan de adopción

1. Agregar `Time:DefaultTimeZone` a `appsettings.json` y `appsettings.Example.json`, y registrar `TimeOptions` en `Program.cs`.
2. Configurar `UtcDateTimeConverter` en las configuraciones de Entity Framework Core para columnas de auditoría y campos `*Utc`.
3. Crear la entidad `Agenda` con `ZonaHorariaIana` (valor por defecto `America/Matamoros`) y agregar la migración de `Eventos` con `AgendaId`, `InicioUtc`, `FinUtc`, `InicioLocal` y `FinLocal`.
4. Implementar `AgendaTimeService` con validación de horas inválidas, ambiguas e intervalos `[InicioUtc, FinUtc)`.
5. Verificar en las respuestas HTTP de la API que todos los instantes UTC incluyan el sufijo `Z` junto con `agenda.timeZone`.
6. Conectar el formulario React enviando `inicioLocal` y `finLocal` sin conversión previa del navegador.
7. Mantener oculto el selector de zona en Configuración; habilitarlo únicamente en un flujo administrativo controlado al dar de alta sedes en otras regiones.

## Pruebas mínimas requeridas

- **Serialización EF Core + JSON:** Leer un evento y un registro de auditoría desde SQL Server con EF Core y verificar que la respuesta JSON conserve la `Z` final (`...Z`).
- **Cambio de horario estacional:** Crear reservas en `America/Matamoros` antes y después del cambio de horario, comprobando que conservan la hora comercial elegida.
- **Horarios límite y nocturnos:** Intentar reservar una hora inexistente (rechazo con error claro), una hora de inicio ambigua (rechazo) y un evento nocturno que termine en hora ambigua (resolución a la primera ocurrencia válida posterior al inicio).
- **Multi-zona en navegador:** Consultar una misma agenda desde navegadores con distinta zona horaria local y confirmar que el horario mostrado respeta `agenda.timeZone`.
- **Multi-sede SaaS:** Crear una agenda con `America/Monterrey` o `America/Mexico_City` y validar que sus eventos no se desplacen respecto a su ciudad ni afecten a sedes en `America/Matamoros`.
- **Empalmes en UTC:** Confirmar que dos eventos consecutivos `[14:00, 18:00)` y `[18:00, 22:00)` no generan conflicto, y que un evento que cruza medianoche bloquea correctamente el inicio del día siguiente.
