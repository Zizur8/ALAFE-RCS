using Alafe.Api.DTOs.Usuarios;
using Alafe.Api.Security;
using Alafe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alafe.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/usuarios")]
[RequirePermission("usuarios.administrar")]
public sealed class UsuariosController(IUsuarioService usuarios) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UsuarioDto>>> GetUsuarios(CancellationToken ct) =>
        Ok(await usuarios.GetUsuariosAsync(ct));

    [HttpPost]
    public async Task<ActionResult<UsuarioDto>> CreateUsuario(CrearUsuarioRequest request, CancellationToken ct)
    {
        var created = await usuarios.CreateUsuarioAsync(request, ct);
        return Created("/api/usuarios", created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UsuarioDto>> UpdateUsuario(int id, ActualizarUsuarioRequest request, CancellationToken ct) =>
        Ok(await usuarios.UpdateUsuarioAsync(id, request, ct));

    [HttpPatch("{id:int}/password")]
    public async Task<IActionResult> ResetPassword(int id, CambiarPasswordUsuarioRequest request, CancellationToken ct)
    {
        await usuarios.ResetPasswordAsync(id, request, ct);
        return NoContent();
    }
}
