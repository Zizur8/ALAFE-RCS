using System.Data;
using Alafe.Api.Data;
using Alafe.Api.DTOs.Configuracion;
using Alafe.Api.Models;
using Alafe.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace Alafe.Api.Services;

public sealed class ConfiguracionService(AlafeDbContext db, ICurrentUserService currentUser) : IConfiguracionService
{
    public async Task<ConfiguracionGeneralDto> GetGeneralAsync(CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var usuarioId = UserId;
        var owner = await db.Propietarios.AsNoTracking().Include(p => p.Plan)
            .SingleOrDefaultAsync(p => p.Id == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("No se encontró el espacio de trabajo.");
        var user = await db.Usuarios.AsNoTracking().SingleOrDefaultAsync(u => u.Id == usuarioId && u.PropietarioId == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("No se encontró el usuario actual.");
        if (owner.Plan is null) throw new KeyNotFoundException("No se encontró el plan del espacio de trabajo.");
        var plan = owner.Plan;
        return new ConfiguracionGeneralDto(owner.Id, owner.NombreEspacioTrabajo, owner.CorreoTitular, owner.PaisCodigo,
            owner.TelefonoPaisCodigo, owner.TelefonoContacto, owner.EstadoSuscripcion,
            new PlanResumenDto(plan.Id, plan.Codigo, plan.Nombre, plan.LimiteAgendas, plan.LimiteUsuarios),
            ToApiTheme(user.TemaVisual), user.VistaAgendaDefault);
    }

    public async Task<ConfiguracionGeneralDto> UpdateGeneralAsync(ActualizarConfiguracionGeneralRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var usuarioId = UserId;
        var owner = await db.Propietarios.SingleOrDefaultAsync(p => p.Id == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("No se encontró el espacio de trabajo.");
        var user = await db.Usuarios.SingleOrDefaultAsync(u => u.Id == usuarioId && u.PropietarioId == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("No se encontró el usuario actual.");
        var paisCodigo = request.PaisCodigo.Trim().ToUpperInvariant();
        var telefonoPaisCodigo = request.TelefonoPaisCodigo.Trim().ToUpperInvariant();
        await EnsureActiveCountryAsync(paisCodigo, cancellationToken);
        await EnsureActiveCountryAsync(telefonoPaisCodigo, cancellationToken);
        var telefono = NormalizePhone(request.TelefonoContacto);
        if (request.TemaVisualUsuario is not ("claro" or "oscuro")) throw new ArgumentException("TemaVisualUsuario debe ser 'claro' u 'oscuro'.");
        if (request.VistaAgendaDefaultUsuario is not ("mes" or "lista")) throw new ArgumentException("VistaAgendaDefaultUsuario debe ser 'mes' o 'lista'.");

        owner.NombreEspacioTrabajo = request.NombreEspacioTrabajo.Trim();
        owner.PaisCodigo = paisCodigo;
        owner.TelefonoPaisCodigo = telefonoPaisCodigo;
        owner.TelefonoContacto = telefono;
        owner.FechaActualizacion = DateTime.UtcNow;
        user.TemaVisual = request.TemaVisualUsuario;
        user.VistaAgendaDefault = request.VistaAgendaDefaultUsuario;
        user.FechaActualizacion = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return await GetGeneralAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AgendaConfigDto>> GetAgendasAsync(CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var agendas = await db.Agendas.AsNoTracking().Where(a => a.PropietarioId == ownerId)
            .OrderBy(a => a.Id).ToListAsync(cancellationToken);
        return agendas.Select(ToDto).ToList();
    }

    public async Task<AgendaConfigDto> CreateAgendaAsync(GuardarAgendaRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        await EnsureAgendaCapacityAsync(ownerId, cancellationToken);
        var normalized = await ValidateAgendaRequestAsync(request, cancellationToken);
        if (await db.Agendas.AnyAsync(a => a.PropietarioId == ownerId && a.Nombre.ToLower() == normalized.Nombre.ToLower(), cancellationToken))
            throw new ConflictException("Ya existe una agenda con ese nombre en este espacio de trabajo.");
        var now = DateTime.UtcNow;
        var agenda = new Agenda
        {
            PropietarioId = ownerId,
            Nombre = normalized.Nombre,
            MonedaCodigo = normalized.MonedaCodigo,
            ZonaHoraria = normalized.ZonaHoraria,
            NombreEventoDefault = normalized.NombreEventoDefault,
            HoraAperturaDefault = normalized.HoraApertura,
            HoraCierreDefault = normalized.HoraCierre,
            TelefonoPaisCodigo = normalized.TelefonoPaisCodigo,
            TelefonoContacto = normalized.TelefonoContacto,
            DireccionNegocio = Clean(request.DireccionNegocio),
            MostrarNotaGeneral = request.MostrarNotaGeneral,
            NotaGeneral = Clean(request.NotaGeneral),
            NotaGeneralActualizadaEn = string.IsNullOrWhiteSpace(request.NotaGeneral) ? null : now,
            NotaGeneralUsuarioId = string.IsNullOrWhiteSpace(request.NotaGeneral) ? null : UserId,
            Activo = request.Activo,
            FechaCreacion = now
        };
        db.Agendas.Add(agenda);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return ToDto(agenda);
    }

    public async Task<AgendaConfigDto> UpdateAgendaAsync(int agendaId, GuardarAgendaRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var agenda = await db.Agendas.SingleOrDefaultAsync(a => a.Id == agendaId && a.PropietarioId == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("La agenda no existe en este espacio de trabajo.");
        var oldNote = agenda.NotaGeneral;
        var normalized = await ValidateAgendaRequestAsync(request, cancellationToken);
        if (await db.Agendas.AnyAsync(a => a.PropietarioId == ownerId && a.Id != agendaId && a.Nombre.ToLower() == normalized.Nombre.ToLower(), cancellationToken))
            throw new ConflictException("Ya existe una agenda con ese nombre en este espacio de trabajo.");

        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        if (agenda.Activo && !request.Activo)
        {
            var activeCount = await db.Agendas.CountAsync(a => a.PropietarioId == ownerId && a.Activo, cancellationToken);
            if (activeCount <= 1) throw new ArgumentException("No se puede desactivar la última agenda activa del espacio de trabajo.");
        }
        if (!agenda.Activo && request.Activo) await EnsureAgendaCapacityAsync(ownerId, cancellationToken);

        agenda.Nombre = normalized.Nombre;
        agenda.MonedaCodigo = normalized.MonedaCodigo;
        agenda.ZonaHoraria = normalized.ZonaHoraria;
        agenda.NombreEventoDefault = normalized.NombreEventoDefault;
        agenda.HoraAperturaDefault = normalized.HoraApertura;
        agenda.HoraCierreDefault = normalized.HoraCierre;
        agenda.TelefonoPaisCodigo = normalized.TelefonoPaisCodigo;
        agenda.TelefonoContacto = normalized.TelefonoContacto;
        agenda.DireccionNegocio = Clean(request.DireccionNegocio);
        agenda.MostrarNotaGeneral = request.MostrarNotaGeneral;
        agenda.NotaGeneral = Clean(request.NotaGeneral);
        agenda.Activo = request.Activo;
        if (!string.Equals(oldNote, agenda.NotaGeneral, StringComparison.Ordinal))
        {
            agenda.NotaGeneralActualizadaEn = DateTime.UtcNow;
            agenda.NotaGeneralUsuarioId = UserId;
        }
        agenda.FechaActualizacion = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return ToDto(agenda);
    }

    private int OwnerId => currentUser.PropietarioId ?? throw new UnauthorizedAccessException("La sesión no contiene un propietario válido.");
    private int UserId => currentUser.UsuarioId ?? throw new UnauthorizedAccessException("La sesión no contiene un usuario válido.");

    private async Task EnsureAgendaCapacityAsync(int ownerId, CancellationToken ct)
    {
        var limit = await db.Propietarios.AsNoTracking().Where(p => p.Id == ownerId)
            .Select(p => p.Plan!.LimiteAgendas).SingleOrDefaultAsync(ct);
        if (limit is null) return;
        var count = await db.Agendas.CountAsync(a => a.PropietarioId == ownerId && a.Activo, ct);
        if (count >= limit.Value) throw new ArgumentException("Se alcanzó el límite de agendas activas del plan.");
    }

    private async Task<(string Nombre, string MonedaCodigo, string ZonaHoraria, string NombreEventoDefault,
        TimeSpan HoraApertura, TimeSpan HoraCierre, string? TelefonoPaisCodigo, string? TelefonoContacto)> ValidateAgendaRequestAsync(
        GuardarAgendaRequest request, CancellationToken ct)
    {
        var moneda = request.MonedaCodigo.Trim().ToUpperInvariant();
        if (!await db.Monedas.AnyAsync(m => m.Codigo == moneda && m.Activo && m.HabilitadaEnAgenda, ct))
            throw new ArgumentException("La moneda debe estar activa y habilitada para agendas.");
        var zone = request.ZonaHoraria.Trim();
        if (!TimeZoneInfo.TryFindSystemTimeZoneById(zone, out _)) throw new ArgumentException("La zona horaria indicada no es válida.");
        var opening = (request.HoraAperturaDefault ?? new TimeOnly(9, 0)).ToTimeSpan();
        var closing = (request.HoraCierreDefault ?? new TimeOnly(22, 0)).ToTimeSpan();
        if (closing <= opening) throw new ArgumentException("La hora de cierre debe ser posterior a la hora de apertura.");

        var phoneCountry = string.IsNullOrWhiteSpace(request.TelefonoPaisCodigo) ? null : request.TelefonoPaisCodigo.Trim().ToUpperInvariant();
        var phone = string.IsNullOrWhiteSpace(request.TelefonoContacto) ? null : NormalizePhone(request.TelefonoContacto);
        if ((phoneCountry is null) != (phone is null)) throw new ArgumentException("El país y el teléfono de contacto deben enviarse juntos.");
        if (phoneCountry is not null) await EnsureActiveCountryAsync(phoneCountry, ct);
        return (request.Nombre.Trim(), moneda, zone, request.NombreEventoDefault.Trim(), opening, closing, phoneCountry, phone);
    }

    private async Task EnsureActiveCountryAsync(string code, CancellationToken ct)
    {
        var country = await db.Paises.AsNoTracking().SingleOrDefaultAsync(p => p.Codigo == code, ct)
            ?? throw new KeyNotFoundException("El país indicado no existe.");
        if (!country.Activo) throw new ArgumentException("El país indicado no está activo.");
    }

    private static string NormalizePhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length is < 10 or > 15) throw new ArgumentException("El teléfono debe contener entre 10 y 15 dígitos.");
        return digits;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string ToApiTheme(string theme) => theme;

    private static AgendaConfigDto ToDto(Agenda agenda) => new(agenda.Id, agenda.Nombre, agenda.MonedaCodigo, agenda.ZonaHoraria,
        agenda.NombreEventoDefault, TimeOnly.FromTimeSpan(agenda.HoraAperturaDefault), TimeOnly.FromTimeSpan(agenda.HoraCierreDefault),
        agenda.TelefonoPaisCodigo, agenda.TelefonoContacto, agenda.DireccionNegocio, agenda.MostrarNotaGeneral,
        agenda.NotaGeneral, agenda.Activo);
}
