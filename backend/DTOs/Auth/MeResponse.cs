namespace Alafe.Api.DTOs.Auth;

public sealed record MeResponse(string NombreCompleto, string TemaVisual, string VistaAgendaDefault,
    string RolNombre, bool EsPropietario, IReadOnlyList<string> Permisos, MePlanResponse Plan,
    IReadOnlyList<MeAgendaResponse> Agendas);

public sealed record MePlanResponse(string Nombre, bool IncluyeMovimientos, bool IncluyeReportes, bool IncluyeInventario);

public sealed record MeAgendaResponse(int Id, string Nombre, string MonedaCodigo, string ZonaHoraria,
    string NombreEventoDefault);
