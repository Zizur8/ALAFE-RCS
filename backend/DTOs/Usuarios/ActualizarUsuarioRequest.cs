using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Usuarios;

public sealed class ActualizarUsuarioRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string NombreCompleto { get; init; } = "";
    [Required, StringLength(2, MinimumLength = 2), RegularExpression("^[A-Za-z]{2}$")] public string TelefonoPaisCodigo { get; init; } = "";
    [Required, StringLength(30, MinimumLength = 4)] public string Telefono { get; init; } = "";
    [Range(1, int.MaxValue)] public int RolId { get; init; }
    public bool Activo { get; init; }
    [Required] public IReadOnlyList<int> AgendaIds { get; init; } = Array.Empty<int>();
}
