namespace Alafe.Api.DTOs.Auth;

public sealed record MeResponse(
    int Id, string NombreCompleto, string Correo, string TelefonoPaisCodigo, string Telefono,
    bool EsPropietario, string TemaVisual, string VistaAgendaDefault, int RolId, string RolNombre,
    int PropietarioId, string NombreEspacioTrabajo, string PaisCodigo, string EstadoSuscripcion,
    PlanResponse Plan, IReadOnlyList<string> Permisos, IReadOnlyList<AgendaResponse> Agendas);

public sealed record PlanResponse(int Id, string Codigo, string Nombre, int? LimiteAgendas,
    int? LimiteUsuarios, bool IncluyeMovimientos, bool IncluyeReportes, bool IncluyeInventario);

public sealed record AgendaResponse(int Id, string Nombre, string MonedaCodigo, string ZonaHoraria,
    string NombreEventoDefault, bool MostrarNotaGeneral, string? NotaGeneral);
