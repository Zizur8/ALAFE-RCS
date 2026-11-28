using System.Data;
using Alafe.Api.Data;
using Alafe.Api.DTOs.Usuarios;
using Alafe.Api.Models;
using Alafe.Api.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Alafe.Api.Services;

public sealed class UsuarioService(AlafeDbContext db, ICurrentUserService currentUser,
    IPasswordHasher<Usuario> passwordHasher) : IUsuarioService
{
    public async Task<UsuariosPaginadosDto> GetUsuariosAsync(int pagina, int tamanoPagina, string? busqueda,
        bool? activo, int? rolId, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var ownerUsers = db.Usuarios.AsNoTracking().Where(u => u.PropietarioId == ownerId);

        var aggregate = await ownerUsers.GroupBy(user => user.PropietarioId)
            .Select(group => new
            {
                Total = group.Count(),
                Activos = group.Sum(user => user.Activo ? 1 : 0)
            })
            .SingleOrDefaultAsync(cancellationToken);
        var totalUsuarios = aggregate?.Total ?? 0;
        var activos = aggregate?.Activos ?? 0;
        var estadisticas = new UsuariosEstadisticasDto(totalUsuarios, activos, totalUsuarios - activos);

        var filteredUsers = ownerUsers;
        var term = busqueda?.Trim();
        if (!string.IsNullOrEmpty(term))
            filteredUsers = filteredUsers.Where(user => user.NombreCompleto.Contains(term) || user.Correo.Contains(term));
        if (activo.HasValue)
            filteredUsers = filteredUsers.Where(user => user.Activo == activo.Value);
        if (rolId.HasValue)
            filteredUsers = filteredUsers.Where(user => user.RolId == rolId.Value);

        var totalItems = await filteredUsers.CountAsync(cancellationToken);
        var totalPaginas = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)tamanoPagina);
        if (totalPaginas == 0)
            pagina = 1;
        else if (pagina > totalPaginas)
            pagina = totalPaginas;

        var users = await filteredUsers
            .OrderByDescending(user => user.EsPropietario)
            .ThenBy(user => user.NombreCompleto)
            .ThenBy(user => user.Id)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .Include(user => user.Rol)
            .Include(user => user.UsuarioAgendas).ThenInclude(userAgenda => userAgenda.Agenda)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return new UsuariosPaginadosDto(users.Select(ToDto).ToList(), pagina, tamanoPagina, totalItems, totalPaginas,
            pagina > 1, pagina < totalPaginas, estadisticas);
    }

    public async Task<UsuarioDto> CreateUsuarioAsync(CrearUsuarioRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var correo = request.Correo.Trim().ToLowerInvariant();
        var phone = NormalizePhone(request.Telefono);
        var phoneCountry = request.TelefonoPaisCodigo.Trim().ToUpperInvariant();
        await EnsurePhoneCountryAsync(phoneCountry, cancellationToken);
        await ValidateRoleAsync(ownerId, request.RolId, cancellationToken);
        var agendaIds = await ValidateAgendasAsync(ownerId, request.AgendaIds, cancellationToken);

        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        if (await db.Usuarios.AnyAsync(u => u.Correo.ToLower() == correo, cancellationToken))
            throw new ConflictException("Ya existe un usuario con ese correo.");
        await EnsureUserCapacityAsync(ownerId, cancellationToken);

        var now = DateTime.UtcNow;
        var user = new Usuario
        {
            PropietarioId = ownerId, RolId = request.RolId, NombreCompleto = request.NombreCompleto.Trim(), Correo = correo,
            TelefonoPaisCodigo = phoneCountry, Telefono = phone, EsPropietario = false, Activo = true, TokenVersion = 1,
            TemaVisual = "claro", VistaAgendaDefault = "mes", FechaCreacion = now
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
        db.Usuarios.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        db.UsuarioAgendas.AddRange(agendaIds.Select(id => new UsuarioAgenda { UsuarioId = user.Id, AgendaId = id, FechaAsignacion = now }));
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return await GetUserDtoAsync(ownerId, user.Id, cancellationToken);
    }

    public async Task<UsuarioDto> UpdateUsuarioAsync(int usuarioId, ActualizarUsuarioRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var user = await db.Usuarios.SingleOrDefaultAsync(u => u.Id == usuarioId && u.PropietarioId == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("El usuario no existe en este espacio de trabajo.");
        if (user.EsPropietario && !request.Activo)
            throw new ForbiddenException("No se puede desactivar al titular del espacio de trabajo.");
        var phone = NormalizePhone(request.Telefono);
        var phoneCountry = request.TelefonoPaisCodigo.Trim().ToUpperInvariant();
        await EnsurePhoneCountryAsync(phoneCountry, cancellationToken);
        await ValidateRoleAsync(ownerId, request.RolId, cancellationToken);
        var agendaIds = await ValidateAgendasAsync(ownerId, request.AgendaIds, cancellationToken);

        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var becameActive = !user.Activo && request.Activo;
        if (becameActive) await EnsureUserCapacityAsync(ownerId, cancellationToken);
        var roleChanged = user.RolId != request.RolId;
        var deactivated = user.Activo && !request.Activo;
        user.NombreCompleto = request.NombreCompleto.Trim();
        user.TelefonoPaisCodigo = phoneCountry;
        user.Telefono = phone;
        user.RolId = request.RolId;
        user.Activo = request.Activo;
        user.FechaActualizacion = DateTime.UtcNow;
        if (roleChanged || deactivated)
        {
            user.TokenVersion++;
            await RevokeRefreshTokensAsync(ownerId, user.Id, cancellationToken);
        }

        var existing = await db.UsuarioAgendas.Where(ua => ua.UsuarioId == user.Id && ua.Usuario!.PropietarioId == ownerId).ToListAsync(cancellationToken);
        var desired = agendaIds.ToHashSet();
        db.UsuarioAgendas.RemoveRange(existing.Where(ua => !desired.Contains(ua.AgendaId)));
        var current = existing.Select(ua => ua.AgendaId).ToHashSet();
        var now = DateTime.UtcNow;
        db.UsuarioAgendas.AddRange(agendaIds.Where(id => !current.Contains(id))
            .Select(id => new UsuarioAgenda { UsuarioId = user.Id, AgendaId = id, FechaAsignacion = now }));
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return await GetUserDtoAsync(ownerId, user.Id, cancellationToken);
    }

    public async Task ResetPasswordAsync(int usuarioId, CambiarPasswordUsuarioRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var user = await db.Usuarios.SingleOrDefaultAsync(u => u.Id == usuarioId && u.PropietarioId == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("El usuario no existe en este espacio de trabajo.");
        user.PasswordHash = passwordHasher.HashPassword(user, request.NuevaPassword);
        user.TokenVersion++;
        user.FechaActualizacion = DateTime.UtcNow;
        await RevokeRefreshTokensAsync(ownerId, user.Id, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    private int OwnerId => currentUser.PropietarioId ?? throw new UnauthorizedAccessException("La sesión no contiene un propietario válido.");

    private async Task EnsureUserCapacityAsync(int ownerId, CancellationToken ct)
    {
        var limit = await db.Propietarios.AsNoTracking().Where(p => p.Id == ownerId).Select(p => p.Plan!.LimiteUsuarios).SingleOrDefaultAsync(ct);
        if (limit is null) return;
        var activeCount = await db.Usuarios.CountAsync(u => u.PropietarioId == ownerId && u.Activo, ct);
        if (activeCount >= limit.Value) throw new ArgumentException("Se alcanzó el límite de usuarios activos del plan.");
    }

    private async Task EnsurePhoneCountryAsync(string code, CancellationToken ct)
    {
        var country = await db.Paises.AsNoTracking().SingleOrDefaultAsync(p => p.Codigo == code, ct)
            ?? throw new ArgumentException("El país del teléfono no existe.");
        if (!country.Activo) throw new ArgumentException("El país del teléfono no está activo.");
    }

    private async Task ValidateRoleAsync(int ownerId, int roleId, CancellationToken ct)
    {
        if (!await db.Roles.AnyAsync(r => r.Id == roleId && r.PropietarioId == ownerId && r.Activo, ct))
            throw new ArgumentException("El rol seleccionado no pertenece a este espacio de trabajo o no está activo.");
    }

    private async Task<List<int>> ValidateAgendasAsync(int ownerId, IReadOnlyList<int>? requestedIds, CancellationToken ct)
    {
        var ids = (requestedIds ?? Array.Empty<int>()).Distinct().ToList();
        if (ids.Count == 0) return ids;
        var count = await db.Agendas.CountAsync(a => a.PropietarioId == ownerId && a.Activo && ids.Contains(a.Id), ct);
        if (count != ids.Count) throw new ArgumentException("Una o más agendas no pertenecen a este espacio de trabajo o no están activas.");
        return ids;
    }

    private async Task RevokeRefreshTokensAsync(int ownerId, int userId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var tokens = await db.RefreshTokens.Where(t => t.UsuarioId == userId && t.Usuario != null &&
            t.Usuario.PropietarioId == ownerId && t.RevocadoEn == null).ToListAsync(ct);
        foreach (var token in tokens) token.RevocadoEn = now;
    }

    private async Task<UsuarioDto> GetUserDtoAsync(int ownerId, int userId, CancellationToken ct)
    {
        var user = await db.Usuarios.AsNoTracking().Where(u => u.Id == userId && u.PropietarioId == ownerId)
            .Include(u => u.Rol).Include(u => u.UsuarioAgendas).ThenInclude(ua => ua.Agenda).SingleAsync(ct);
        return ToDto(user);
    }

    private static UsuarioDto ToDto(Usuario user) => new(user.Id, user.NombreCompleto, user.Correo,
        user.TelefonoPaisCodigo, user.Telefono, user.EsPropietario, user.Activo, user.RolId, user.Rol?.Nombre ?? "",
        user.UltimoAcceso, user.UsuarioAgendas.Where(ua => ua.Agenda is not null)
            .Select(ua => new AgendaResumenDto(ua.Agenda!.Id, ua.Agenda.Nombre)).OrderBy(a => a.Nombre).ToArray());

    private static string NormalizePhone(string value)
    {
        var normalized = new string(value.Where(char.IsDigit).ToArray());
        if (normalized.Length is < 10 or > 15) throw new ArgumentException("El teléfono debe contener entre 10 y 15 dígitos.");
        return normalized;
    }
}
