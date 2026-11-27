using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Usuarios;

public sealed class CrearUsuarioRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string NombreCompleto { get; init; } = "";
    [Required, EmailAddress, StringLength(254)] public string Correo { get; init; } = "";
    [Required, MinLength(8), StringLength(200)] public string Password { get; init; } = "";
    [Required, StringLength(2, MinimumLength = 2), RegularExpression("^[A-Za-z]{2}$")] public string TelefonoPaisCodigo { get; init; } = "";
    [Required, StringLength(30, MinimumLength = 4)] public string Telefono { get; init; } = "";
    [Range(1, int.MaxValue)] public int RolId { get; init; }
    [Required] public IReadOnlyList<int> AgendaIds { get; init; } = Array.Empty<int>();
}
