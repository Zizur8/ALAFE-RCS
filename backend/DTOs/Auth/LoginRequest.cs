using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Auth;

public sealed class LoginRequest
{
    [Required, EmailAddress, StringLength(254)] public string Correo { get; init; } = "";
    [Required, StringLength(200)] public string Password { get; init; } = "";
    public bool Recordarme { get; init; }
}
