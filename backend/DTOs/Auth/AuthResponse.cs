namespace Alafe.Api.DTOs.Auth;

public sealed record AuthResponse(string AccessToken, DateTimeOffset AccessTokenExpiraEn, string RefreshToken,
    DateTimeOffset RefreshTokenExpiraEn);
