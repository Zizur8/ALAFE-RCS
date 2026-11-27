using Alafe.Api.Data;
using Alafe.Api.DTOs.Roles;
using Alafe.Api.Models;
using Alafe.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace Alafe.Api.Services;

public sealed class RolService(AlafeDbContext db, ICurrentUserService currentUser) : IRolService
{
    public async Task<IReadOnlyList<PermisoDto>> GetCatalogoPermisosAsync(CancellationToken cancellationToken = default) =>
        await db.Permisos.AsNoTracking().OrderBy(p => p.Modulo).ThenBy(p => p.Id)
            .Select(p => new PermisoDto(p.Id, p.Clave, p.Modulo, p.Descripcion)).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<RolDto>> GetRolesAsync(CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var roles = await db.Roles.AsNoTracking().Where(r => r.PropietarioId == ownerId)
            .OrderBy(r => r.Nombre).Select(r => new
            {
                r.Id, r.Nombre, r.Descripcion, r.EsSistema, r.Activo,
                TotalUsuarios = r.Usuarios.Count,
                Permisos = r.RolPermisos.Select(rp => rp.Permiso!.Clave).OrderBy(k => k).ToList()
            }).ToListAsync(cancellationToken);
        return roles.Select(r => new RolDto(r.Id, r.Nombre, r.Descripcion, r.EsSistema, r.Activo, r.TotalUsuarios, r.Permisos)).ToList();
    }

    public async Task<RolDto> CreateRolAsync(CrearRolRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var name = request.Nombre.Trim();
        if (await db.Roles.AnyAsync(r => r.PropietarioId == ownerId && r.Nombre.ToLower() == name.ToLower(), cancellationToken))
            throw new ConflictException("Ya existe un rol con ese nombre en este espacio de trabajo.");
        var permissions = await ResolvePermissionsAsync(request.PermisoClaves, cancellationToken);
        var role = new Rol { PropietarioId = ownerId, Nombre = name, Descripcion = Clean(request.Descripcion), EsSistema = false,
            Activo = true, FechaCreacion = DateTime.UtcNow };
        db.Roles.Add(role);
        await db.SaveChangesAsync(cancellationToken);
        db.RolPermisos.AddRange(permissions.Select(p => new RolPermiso { RolId = role.Id, PermisoId = p.Id }));
        await db.SaveChangesAsync(cancellationToken);
        return new RolDto(role.Id, role.Nombre, role.Descripcion, role.EsSistema, role.Activo, 0,
            permissions.Select(p => p.Clave).OrderBy(k => k).ToArray());
    }

    public async Task<RolDto> UpdateRolAsync(int rolId, ActualizarRolRequest request, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var role = await db.Roles.Include(r => r.RolPermisos).ThenInclude(rp => rp.Permiso)
            .SingleOrDefaultAsync(r => r.Id == rolId && r.PropietarioId == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("El rol no existe en este espacio de trabajo.");
        var name = request.Nombre.Trim();
        if (role.EsSistema && (!string.Equals(role.Nombre, name, StringComparison.Ordinal) || !request.Activo))
            throw new ForbiddenException("No se puede renombrar ni desactivar un rol de sistema.");
        if (await db.Roles.AnyAsync(r => r.PropietarioId == ownerId && r.Id != role.Id && r.Nombre.ToLower() == name.ToLower(), cancellationToken))
            throw new ConflictException("Ya existe un rol con ese nombre en este espacio de trabajo.");
        var permissions = await ResolvePermissionsAsync(request.PermisoClaves, cancellationToken);
        var oldKeys = role.RolPermisos.Where(rp => rp.Permiso != null).Select(rp => rp.Permiso!.Clave).OrderBy(k => k).ToArray();
        var newKeys = permissions.Select(p => p.Clave).OrderBy(k => k).ToArray();
        var permissionsChanged = !oldKeys.SequenceEqual(newKeys, StringComparer.Ordinal);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        role.Nombre = role.EsSistema ? role.Nombre : name;
        role.Descripcion = Clean(request.Descripcion);
        role.Activo = request.Activo;
        role.FechaActualizacion = DateTime.UtcNow;
        db.RolPermisos.RemoveRange(role.RolPermisos);
        db.RolPermisos.AddRange(permissions.Select(p => new RolPermiso { RolId = role.Id, PermisoId = p.Id }));
        if (permissionsChanged)
        {
            var assignedUsers = await db.Usuarios.Where(u => u.PropietarioId == ownerId && u.RolId == role.Id).ToListAsync(cancellationToken);
            foreach (var user in assignedUsers) user.TokenVersion++;
        }
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        return await GetRoleDtoAsync(ownerId, role.Id, cancellationToken);
    }

    public async Task DeleteRolAsync(int rolId, CancellationToken cancellationToken = default)
    {
        var ownerId = OwnerId;
        var role = await db.Roles.SingleOrDefaultAsync(r => r.Id == rolId && r.PropietarioId == ownerId, cancellationToken)
            ?? throw new KeyNotFoundException("El rol no existe en este espacio de trabajo.");
        if (role.EsSistema) throw new ForbiddenException("Los roles de sistema no se pueden eliminar.");
        if (await db.Usuarios.AnyAsync(u => u.PropietarioId == ownerId && u.RolId == role.Id, cancellationToken))
            throw new ConflictException("No se puede eliminar un rol que tiene usuarios asignados.");
        db.Roles.Remove(role);
        await db.SaveChangesAsync(cancellationToken);
    }

    private int OwnerId => currentUser.PropietarioId ?? throw new UnauthorizedAccessException("La sesión no contiene un propietario válido.");

    private async Task<List<Permiso>> ResolvePermissionsAsync(IReadOnlyList<string>? keys, CancellationToken ct)
    {
        var requested = (keys ?? Array.Empty<string>()).Select(k => k?.Trim() ?? "").Where(k => k.Length > 0)
            .Distinct(StringComparer.Ordinal).ToArray();
        var found = await db.Permisos.Where(p => requested.Contains(p.Clave)).ToListAsync(ct);
        if (found.Count != requested.Length)
            throw new ArgumentException("Una o más claves de permiso no existen en el catálogo.");
        return found;
    }

    private async Task<RolDto> GetRoleDtoAsync(int ownerId, int roleId, CancellationToken ct)
    {
        var role = await db.Roles.AsNoTracking().Where(r => r.PropietarioId == ownerId && r.Id == roleId)
            .Select(r => new { r.Id, r.Nombre, r.Descripcion, r.EsSistema, r.Activo, TotalUsuarios = r.Usuarios.Count,
                Permisos = r.RolPermisos.Select(rp => rp.Permiso!.Clave).OrderBy(k => k).ToList() })
            .SingleAsync(ct);
        return new RolDto(role.Id, role.Nombre, role.Descripcion, role.EsSistema, role.Activo, role.TotalUsuarios, role.Permisos);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
