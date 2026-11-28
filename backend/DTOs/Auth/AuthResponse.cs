namespace Alafe.Api.DTOs.Auth;

/// <summary>Respuesta pública de autenticación. El refresh token solo se entrega en cookie.</summary>
public sealed record AccessTokenResponse(string AccessToken, DateTimeOffset AccessTokenExpiraEn);

/// <summary>Resultado interno del servicio para que el controlador emita la cookie de refresh.</summary>
public sealed record AuthSessionResult(string AccessToken, DateTimeOffset AccessTokenExpiraEn, string RefreshToken,
    DateTimeOffset RefreshTokenExpiraEn)
{
    public AccessTokenResponse ToAccessTokenResponse() => new(AccessToken, AccessTokenExpiraEn);
}
