using System.Data;
using Alafe.Api.Data;
using Alafe.Api.DTOs.Auth;
using Alafe.Api.Models;
using Alafe.Api.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Alafe.Api.Services;

public sealed class AuthService(AlafeDbContext db, IPasswordHasher<Usuario> passwordHasher,
    IJwtTokenService jwt, IOptions<JwtOptions> jwtOptions, IAgendaAccessService agendaAccess) : IAuthService
{
    private static readonly string[] ReceptionistPermissions = ["eventos.consultar", "eventos.crear", "eventos.editar", "clientes.consultar", "clientes.gestionar"];
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async Task<AuthSessionResult> RegisterOwnerAsync(RegisterOwnerRequest request, string? ip, string? userAgent, CancellationToken ct = default)
    {
        var correo = request.Correo.Trim().ToLowerInvariant();
        if (await db.Usuarios.AnyAsync(u => u.Correo.ToLower() == correo, ct)) throw new ConflictException("Ya existe una cuenta con ese correo.");

        var plan = await db.Planes.AsNoTracking().SingleOrDefaultAsync(x => x.Id == request.PlanId, ct)
            ?? throw new KeyNotFoundException("El plan solicitado no existe.");
        if (!plan.Activo) throw new ArgumentException("El plan solicitado no está activo.");
        var paisCodigo = request.PaisCodigo.Trim().ToUpperInvariant();
        var pais = await db.Paises.AsNoTracking().SingleOrDefaultAsync(x => x.Codigo == paisCodigo, ct)
            ?? throw new KeyNotFoundException("El país solicitado no existe.");
        if (!pais.Activo) throw new ArgumentException("El país solicitado no está activo.");
        var telefonoPaisCodigo = request.TelefonoPaisCodigo.Trim().ToUpperInvariant();
        var telefonoPais = await db.Paises.AsNoTracking().SingleOrDefaultAsync(x => x.Codigo == telefonoPaisCodigo, ct)
            ?? throw new KeyNotFoundException("El país del teléfono no existe.");
        if (!telefonoPais.Activo) throw new ArgumentException("El país del teléfono no está activo.");
        var telefono = new string(request.Telefono.Where(char.IsDigit).ToArray());
        if (telefono.Length is < 10 or > 15) throw new ArgumentException("El teléfono debe contener entre 10 y 15 dígitos.");

        var zona = string.IsNullOrWhiteSpace(request.ZonaHoraria) ? "America/Matamoros" : request.ZonaHoraria.Trim();
        if (!string.IsNullOrWhiteSpace(request.ZonaHoraria) && !TimeZoneInfo.TryFindSystemTimeZoneById(zona, out _))
            throw new ArgumentException("La zona horaria indicada no es válida.");
        var monedaCodigo = string.IsNullOrWhiteSpace(request.MonedaCodigo) ? pais.MonedaDefaultCodigo : request.MonedaCodigo.Trim().ToUpperInvariant();
        var monedaValida = await db.Monedas.AnyAsync(x => x.Codigo == monedaCodigo && x.Activo && x.HabilitadaEnAgenda, ct);
        if (!monedaValida) throw new ArgumentException("La moneda seleccionada no está habilitada para agendas.");

        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        if (await db.Usuarios.AnyAsync(u => u.Correo.ToLower() == correo, ct)) throw new ConflictException("Ya existe una cuenta con ese correo.");
        var now = DateTime.UtcNow;
        var owner = new Propietario { PlanId = plan.Id, NombreEspacioTrabajo = request.NombreEspacioTrabajo.Trim(), CorreoTitular = correo,
            PaisCodigo = paisCodigo, TelefonoPaisCodigo = telefonoPaisCodigo, TelefonoContacto = telefono, EstadoSuscripcion = "Activa",
            FechaInicioSuscripcion = now, Activo = true, FechaCreacion = now };
        db.Propietarios.Add(owner);
        await db.SaveChangesAsync(ct);

        var admin = new Rol { PropietarioId = owner.Id, Nombre = "Administrador", Descripcion = "Control total del espacio de trabajo.", EsSistema = true, Activo = true, FechaCreacion = now };
        var receptionist = new Rol { PropietarioId = owner.Id, Nombre = "Recepcionista", Descripcion = "Operación diaria de eventos y clientes.", EsSistema = true, Activo = true, FechaCreacion = now };
        db.Roles.AddRange(admin, receptionist);
        await db.SaveChangesAsync(ct);
        var permissions = await db.Permisos.ToDictionaryAsync(p => p.Clave, ct);
        db.RolPermisos.AddRange(permissions.Values.Select(p => new RolPermiso { RolId = admin.Id, PermisoId = p.Id }));
        foreach (var key in ReceptionistPermissions)
        {
            if (!permissions.TryGetValue(key, out var permission)) throw new InvalidOperationException($"Falta el permiso de sistema '{key}'.");
            db.RolPermisos.Add(new RolPermiso { RolId = receptionist.Id, PermisoId = permission.Id });
        }
        var user = new Usuario { PropietarioId = owner.Id, RolId = admin.Id, NombreCompleto = request.NombreCompleto.Trim(), Correo = correo,
            TelefonoPaisCodigo = telefonoPaisCodigo, Telefono = telefono, EsPropietario = true, TokenVersion = 1, Activo = true,
            TemaVisual = "claro", VistaAgendaDefault = "mes", FechaCreacion = now };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
        db.Usuarios.Add(user);
        await db.SaveChangesAsync(ct);
        db.Agendas.Add(new Agenda { PropietarioId = owner.Id, Nombre = request.NombreAgenda.Trim(), MonedaCodigo = monedaCodigo,
            ZonaHoraria = zona, NombreEventoDefault = string.IsNullOrWhiteSpace(request.NombreEventoDefault) ? "Evento" : request.NombreEventoDefault.Trim(),
            Activo = true, FechaCreacion = now });
        await db.SaveChangesAsync(ct);
        var response = await CreateSessionAsync(user, false, ip, userAgent, ct);
        await tx.CommitAsync(ct);
        return response;
    }

    public async Task<AuthSessionResult> LoginAsync(LoginRequest request, string? ip, string? userAgent, CancellationToken ct = default)
    {
        var correo = request.Correo.Trim().ToLowerInvariant();
        var user = await db.Usuarios.Include(u => u.Propietario).Include(u => u.Rol).SingleOrDefaultAsync(u => u.Correo.ToLower() == correo, ct);
        var valid = user is not null && passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) != PasswordVerificationResult.Failed;
        if (!valid || user is null || !user.Activo || user.Propietario is null || !user.Propietario.Activo || user.Rol is null || !user.Rol.Activo ||
            user.Propietario.EstadoSuscripcion is not ("Activa" or "Prueba")) throw new UnauthorizedAccessException("Correo o contraseña incorrectos.");
        user.UltimoAcceso = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return await CreateSessionAsync(user, request.Recordarme, ip, userAgent, ct);
    }

    public async Task<AuthSessionResult> RefreshAsync(string refreshToken, string? ip, string? userAgent, CancellationToken ct = default)
    {
        var hash = jwt.ComputeHash(refreshToken);
        var stored = await db.RefreshTokens.Include(x => x.Usuario).ThenInclude(u => u!.Propietario).SingleOrDefaultAsync(x => x.TokenHash == hash, ct);
        if (stored is null) throw new UnauthorizedAccessException("La sesión no es válida.");
        if (stored.RevocadoEn is not null)
        {
            var user = stored.Usuario!;
            user.TokenVersion++;
            var now = DateTime.UtcNow;
            var activeTokens = await db.RefreshTokens.Where(x => x.UsuarioId == user.Id && x.RevocadoEn == null).ToListAsync(ct);
            foreach (var token in activeTokens) token.RevocadoEn = now;
            await db.SaveChangesAsync(ct);
            throw new UnauthorizedAccessException("La sesión no es válida.");
        }
        var currentUser = stored.Usuario;
        if (stored.ExpiraEn <= DateTime.UtcNow || currentUser is null || !currentUser.Activo || currentUser.Propietario is null || !currentUser.Propietario.Activo)
            throw new UnauthorizedAccessException("La sesión no es válida.");
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var response = await CreateSessionAsync(currentUser, stored.Recordarme, ip, userAgent, ct);
        stored.RevocadoEn = DateTime.UtcNow;
        stored.ReemplazadoPorTokenHash = jwt.ComputeHash(response.RefreshToken);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return response;
    }

    public async Task LogoutAsync(int usuarioId, string? refreshToken, LogoutRequest request, CancellationToken ct = default)
    {
        var user = await db.Usuarios.SingleOrDefaultAsync(u => u.Id == usuarioId, ct) ?? throw new KeyNotFoundException("El usuario no existe.");
        var now = DateTime.UtcNow;
        if (request.CerrarTodasLasSesiones)
        {
            user.TokenVersion++;
            var active = await db.RefreshTokens.Where(t => t.UsuarioId == usuarioId && t.RevocadoEn == null).ToListAsync(ct);
            foreach (var token in active) token.RevocadoEn = now;
        }
        else if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            var hash = jwt.ComputeHash(refreshToken);
            var token = await db.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash && t.UsuarioId == usuarioId && t.RevocadoEn == null, ct);
            if (token is not null) token.RevocadoEn = now;
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task<MeResponse> GetMeAsync(int usuarioId, CancellationToken ct = default)
    {
        var user = await db.Usuarios.AsNoTracking().Include(u => u.Rol).Include(u => u.Propietario).ThenInclude(p => p!.Plan)
            .SingleOrDefaultAsync(u => u.Id == usuarioId, ct) ?? throw new KeyNotFoundException("El usuario no existe.");
        if (user.Propietario is null || user.Rol is null || user.Propietario.Plan is null) throw new KeyNotFoundException("No se encontró el espacio de trabajo asociado.");
        var permissions = await db.Roles.AsNoTracking().Where(r => r.Id == user.RolId && r.PropietarioId == user.PropietarioId && r.Activo)
            .SelectMany(r => r.RolPermisos).Select(rp => rp.Permiso!.Clave).Distinct().OrderBy(x => x).ToListAsync(ct);
        var agendas = await agendaAccess.QueryAccessibleAgendas(usuarioId).OrderBy(a => a.Nombre)
            .Select(a => new MeAgendaResponse(a.Id, a.Nombre, a.MonedaCodigo, a.ZonaHoraria, a.NombreEventoDefault)).ToListAsync(ct);
        var owner = user.Propietario;
        var plan = owner.Plan;
        return new MeResponse(user.NombreCompleto, user.TemaVisual, user.VistaAgendaDefault, user.Rol.Nombre, user.EsPropietario,
            permissions, new MePlanResponse(plan.Nombre, plan.IncluyeMovimientos, plan.IncluyeReportes, plan.IncluyeInventario), agendas);
    }

    private async Task<AuthSessionResult> CreateSessionAsync(Usuario user, bool rememberMe, string? ip, string? userAgent, CancellationToken ct)
    {
        var (accessToken, accessExpires) = jwt.GenerateAccessToken(user);
        var refreshToken = jwt.GenerateRefreshToken();
        var days = rememberMe ? _jwtOptions.RefreshTokenRememberMeDays : _jwtOptions.RefreshTokenDays;
        var refreshExpires = DateTimeOffset.UtcNow.AddDays(days);
        db.RefreshTokens.Add(new RefreshToken { UsuarioId = user.Id, TokenHash = jwt.ComputeHash(refreshToken), Recordarme = rememberMe,
            ExpiraEn = refreshExpires.UtcDateTime, CreadoEn = DateTime.UtcNow, IpCreacion = Truncate(ip, 45), UserAgent = Truncate(userAgent, 256) });
        await db.SaveChangesAsync(ct);
        return new AuthSessionResult(accessToken, accessExpires, refreshToken, refreshExpires);
    }

    private static string? Truncate(string? value, int length) => value is null || value.Length <= length ? value : value[..length];
}

public sealed class ConflictException(string message) : Exception(message);
public sealed class ForbiddenException(string message) : Exception(message);
