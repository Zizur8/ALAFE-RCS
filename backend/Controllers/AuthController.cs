using System.Security.Claims;
using Alafe.Api.DTOs.Auth;
using Alafe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alafe.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    [AllowAnonymous, HttpPost("register-owner")]
    public async Task<IActionResult> RegisterOwner(RegisterOwnerRequest request, CancellationToken ct)
    {
        var response = await auth.RegisterOwnerAsync(request, Ip, UserAgent, ct);
        return Created("/api/auth/me", response);
    }

    [AllowAnonymous, HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken ct) => Ok(await auth.LoginAsync(request, Ip, UserAgent, ct));

    [AllowAnonymous, HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshTokenRequest request, CancellationToken ct) => Ok(await auth.RefreshAsync(request, Ip, UserAgent, ct));

    [Authorize, HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest request, CancellationToken ct)
    {
        await auth.LogoutAsync(UsuarioId, request, ct);
        return NoContent();
    }

    [Authorize, HttpGet("me")]
    public async Task<ActionResult<MeResponse>> Me(CancellationToken ct) => Ok(await auth.GetMeAsync(UsuarioId, ct));

    private int UsuarioId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id)
        ? id : throw new UnauthorizedAccessException("La sesión no contiene un usuario válido.");
    private string? Ip => HttpContext.Connection.RemoteIpAddress?.ToString();
    private string? UserAgent => Request.Headers.UserAgent.ToString();
}
