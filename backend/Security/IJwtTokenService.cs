using Alafe.Api.Models;

namespace Alafe.Api.Security;

public interface IJwtTokenService
{
    (string Token, DateTimeOffset ExpiresAt) GenerateAccessToken(Usuario usuario);
    string GenerateRefreshToken();
    string ComputeHash(string refreshToken);
}
