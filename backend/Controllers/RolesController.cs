using Alafe.Api.DTOs.Roles;
using Alafe.Api.Security;
using Alafe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alafe.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/roles")]
public sealed class RolesController(IRolService roles) : ControllerBase
{
    private const string Permission = "permisos.administrar";

    [HttpGet("permisos"), RequirePermission(Permission)]
    public async Task<ActionResult<IReadOnlyList<PermisoDto>>> GetCatalogoPermisos(CancellationToken ct) =>
        Ok(await roles.GetCatalogoPermisosAsync(ct));

    [HttpGet, RequirePermission(Permission)]
    public async Task<ActionResult<IReadOnlyList<RolDto>>> GetRoles(CancellationToken ct) =>
        Ok(await roles.GetRolesAsync(ct));

    [HttpPost, RequirePermission(Permission)]
    public async Task<ActionResult<RolDto>> CreateRol(CrearRolRequest request, CancellationToken ct)
    {
        var created = await roles.CreateRolAsync(request, ct);
        return Created("/api/roles", created);
    }

    [HttpPut("{id:int}"), RequirePermission(Permission)]
    public async Task<ActionResult<RolDto>> UpdateRol(int id, ActualizarRolRequest request, CancellationToken ct) =>
        Ok(await roles.UpdateRolAsync(id, request, ct));

    [HttpDelete("{id:int}"), RequirePermission(Permission)]
    public async Task<IActionResult> DeleteRol(int id, CancellationToken ct)
    {
        await roles.DeleteRolAsync(id, ct);
        return NoContent();
    }
}
