using System.Security.Claims;
using Alafe.Api.DTOs.Auth;
using Alafe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Alafe.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth, IHostEnvironment env) : ControllerBase
{
    private const string RefreshCookieName = "alafe_refresh_token";

    [AllowAnonymous, HttpPost("register-owner")]
    public async Task<IActionResult> RegisterOwner(RegisterOwnerRequest request, CancellationToken ct)
    {
        var response = await auth.RegisterOwnerAsync(request, Ip, UserAgent, ct);
        WriteRefreshCookie(response);
        return Created("/api/auth/me", response.ToAccessTokenResponse());
    }

    [AllowAnonymous, HttpPost("login")]
    public async Task<ActionResult<AccessTokenResponse>> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await auth.LoginAsync(request, Ip, UserAgent, ct);
        WriteRefreshCookie(result);
        return Ok(result.ToAccessTokenResponse());
    }

    [AllowAnonymous, HttpPost("refresh")]
    public async Task<ActionResult<AccessTokenResponse>> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies[RefreshCookieName];
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            DeleteRefreshCookie();
            return Unauthorized();
        }

        try
        {
            var result = await auth.RefreshAsync(refreshToken, Ip, UserAgent, ct);
            WriteRefreshCookie(result);
            return Ok(result.ToAccessTokenResponse());
        }
        catch (UnauthorizedAccessException)
        {
            DeleteRefreshCookie();
            return Unauthorized();
        }
    }

    [Authorize, HttpPost("logout")]
    public async Task<IActionResult> Logout(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] LogoutRequest? request, CancellationToken ct)
    {
        await auth.LogoutAsync(UsuarioId, Request.Cookies[RefreshCookieName], request ?? new LogoutRequest(), ct);
        DeleteRefreshCookie();
        return NoContent();
    }

    [Authorize, HttpGet("me")]
    public async Task<ActionResult<MeResponse>> Me(CancellationToken ct) => Ok(await auth.GetMeAsync(UsuarioId, ct));

    private int UsuarioId => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"), out var id)
        ? id : throw new UnauthorizedAccessException("La sesión no contiene un usuario válido.");
    private string? Ip => HttpContext.Connection.RemoteIpAddress?.ToString();
    private string? UserAgent => Request.Headers.UserAgent.ToString();

    private CookieOptions RefreshCookieOptions(DateTimeOffset? expires = null) => new()
    {
        HttpOnly = true,
        IsEssential = true,
        Path = "/api/auth",
        SameSite = SameSiteMode.Lax,
        Secure = Request.IsHttps || !env.IsDevelopment(),
        Expires = expires
    };

    private void WriteRefreshCookie(AuthSessionResult result) =>
        Response.Cookies.Append(RefreshCookieName, result.RefreshToken, RefreshCookieOptions(result.RefreshTokenExpiraEn));

    private void DeleteRefreshCookie() =>
        Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());
}
