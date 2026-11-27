using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Alafe.Api.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Alafe.Api.Security;

public sealed class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    private readonly JwtOptions _options = options.Value;

    public (string Token, DateTimeOffset ExpiresAt) GenerateAccessToken(Usuario usuario)
    {
        if (string.IsNullOrWhiteSpace(_options.Key)) throw new InvalidOperationException("La configuración JWT no contiene una clave.");
        var now = DateTimeOffset.UtcNow;
        var expires = now.AddMinutes(_options.AccessTokenMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
            new Claim("propietarioId", usuario.PropietarioId.ToString()),
            new Claim("rolId", usuario.RolId.ToString()),
            new Claim("esPropietario", usuario.EsPropietario.ToString().ToLowerInvariant()),
            new Claim("tokenVersion", usuario.TokenVersion.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(_options.Issuer, _options.Audience, claims, now.UtcDateTime,
            expires.UtcDateTime, credentials);
        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public string GenerateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    public string ComputeHash(string refreshToken) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
}
