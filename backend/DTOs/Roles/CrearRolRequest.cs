using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Roles;

public sealed class CrearRolRequest
{
    [Required, StringLength(50, MinimumLength = 1)] public string Nombre { get; init; } = "";
    [StringLength(200)] public string? Descripcion { get; init; }
    [Required] public IReadOnlyList<string> PermisoClaves { get; init; } = Array.Empty<string>();
}
