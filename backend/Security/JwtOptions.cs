namespace Alafe.Api.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Key { get; set; } = "";
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public int AccessTokenMinutes { get; set; } = 20;
    public int RefreshTokenDays { get; set; } = 1;
    public int RefreshTokenRememberMeDays { get; set; } = 30;
}
