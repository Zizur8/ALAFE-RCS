namespace Alafe.Api.DTOs.Configuracion;

public sealed record AgendaConfigDto(int Id, string Nombre, string MonedaCodigo, string ZonaHoraria,
    string NombreEventoDefault, TimeOnly HoraAperturaDefault, TimeOnly HoraCierreDefault,
    string? TelefonoPaisCodigo, string? TelefonoContacto, string? DireccionNegocio,
    bool MostrarNotaGeneral, string? NotaGeneral, bool Activo);
