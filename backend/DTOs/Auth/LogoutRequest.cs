using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Auth;

public sealed class LogoutRequest
{
    [StringLength(512, MinimumLength = 32)] public string? RefreshToken { get; init; }
    public bool CerrarTodasLasSesiones { get; init; }
}
