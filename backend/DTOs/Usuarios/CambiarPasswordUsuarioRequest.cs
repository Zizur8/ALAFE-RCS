using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Usuarios;

public sealed class CambiarPasswordUsuarioRequest
{
    [Required, MinLength(8), StringLength(200)] public string NuevaPassword { get; init; } = "";
}
