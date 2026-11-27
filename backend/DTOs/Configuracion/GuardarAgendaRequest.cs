using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Configuracion;

public sealed class GuardarAgendaRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string Nombre { get; init; } = "";
    [Required, StringLength(3, MinimumLength = 3), RegularExpression("^[A-Za-z]{3}$")] public string MonedaCodigo { get; init; } = "";
    [Required, StringLength(64, MinimumLength = 1)] public string ZonaHoraria { get; init; } = "";
    [Required, StringLength(150, MinimumLength = 1)] public string NombreEventoDefault { get; init; } = "";
    public TimeOnly? HoraAperturaDefault { get; init; }
    public TimeOnly? HoraCierreDefault { get; init; }
    [StringLength(2, MinimumLength = 2), RegularExpression("^[A-Za-z]{2}$")] public string? TelefonoPaisCodigo { get; init; }
    [StringLength(20)] public string? TelefonoContacto { get; init; }
    [StringLength(200)] public string? DireccionNegocio { get; init; }
    public bool MostrarNotaGeneral { get; init; }
    [StringLength(1000)] public string? NotaGeneral { get; init; }
    public bool Activo { get; init; }
}
