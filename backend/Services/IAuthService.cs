using Alafe.Api.DTOs.Auth;

namespace Alafe.Api.Services;

public interface IAuthService
{
    Task<AuthSessionResult> RegisterOwnerAsync(RegisterOwnerRequest request, string? ip, string? userAgent, CancellationToken cancellationToken = default);
    Task<AuthSessionResult> LoginAsync(LoginRequest request, string? ip, string? userAgent, CancellationToken cancellationToken = default);
    Task<AuthSessionResult> RefreshAsync(string refreshToken, string? ip, string? userAgent, CancellationToken cancellationToken = default);
    Task LogoutAsync(int usuarioId, string? refreshToken, LogoutRequest request, CancellationToken cancellationToken = default);
    Task<MeResponse> GetMeAsync(int usuarioId, CancellationToken cancellationToken = default);
}
