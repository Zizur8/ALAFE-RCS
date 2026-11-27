using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Auth;

public sealed class RegisterOwnerRequest
{
    [Required, StringLength(160, MinimumLength = 2)] public string NombreCompleto { get; init; } = "";
    [Required, EmailAddress, StringLength(254)] public string Correo { get; init; } = "";
    [Required, MinLength(8), StringLength(200)] public string Password { get; init; } = "";
    [Required, StringLength(120, MinimumLength = 2)] public string NombreEspacioTrabajo { get; init; } = "";
    [Required, StringLength(2, MinimumLength = 2), RegularExpression("^[A-Za-z]{2}$")] public string PaisCodigo { get; init; } = "";
    [Required, StringLength(2, MinimumLength = 2), RegularExpression("^[A-Za-z]{2}$")] public string TelefonoPaisCodigo { get; init; } = "";
    [Required, StringLength(30, MinimumLength = 4)] public string Telefono { get; init; } = "";
    [Range(1, int.MaxValue)] public int PlanId { get; init; }
    [Required, StringLength(100, MinimumLength = 2)] public string NombreAgenda { get; init; } = "";
    [StringLength(3, MinimumLength = 3), RegularExpression("^[A-Za-z]{3}$")] public string? MonedaCodigo { get; init; }
    [RegularExpression("^[A-Za-z_+-]+(?:/[A-Za-z0-9_.+-]+)+$", ErrorMessage = "La zona horaria debe tener formato IANA.")] public string? ZonaHoraria { get; init; }
    [StringLength(120)] public string? NombreEventoDefault { get; init; }
}
