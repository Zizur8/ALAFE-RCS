using Alafe.Api.DTOs.Auth;

namespace Alafe.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterOwnerAsync(RegisterOwnerRequest request, string? ip, string? userAgent, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ip, string? userAgent, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshAsync(RefreshTokenRequest request, string? ip, string? userAgent, CancellationToken cancellationToken = default);
    Task LogoutAsync(int usuarioId, LogoutRequest request, CancellationToken cancellationToken = default);
    Task<MeResponse> GetMeAsync(int usuarioId, CancellationToken cancellationToken = default);
}
