using Alafe.Api.DTOs.Roles;

namespace Alafe.Api.Services;

public interface IRolService
{
    Task<IReadOnlyList<PermisoDto>> GetCatalogoPermisosAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RolDto>> GetRolesAsync(CancellationToken cancellationToken = default);
    Task<RolDto> CreateRolAsync(CrearRolRequest request, CancellationToken cancellationToken = default);
    Task<RolDto> UpdateRolAsync(int rolId, ActualizarRolRequest request, CancellationToken cancellationToken = default);
    Task DeleteRolAsync(int rolId, CancellationToken cancellationToken = default);
}
