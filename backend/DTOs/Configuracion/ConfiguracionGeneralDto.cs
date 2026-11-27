namespace Alafe.Api.DTOs.Configuracion;

public sealed record ConfiguracionGeneralDto(int PropietarioId, string NombreEspacioTrabajo, string CorreoTitular,
    string PaisCodigo, string TelefonoPaisCodigo, string TelefonoContacto, string EstadoSuscripcion,
    PlanResumenDto Plan, string TemaVisualUsuario, string VistaAgendaDefaultUsuario);

public sealed record PlanResumenDto(int Id, string Codigo, string Nombre, int? LimiteAgendas, int? LimiteUsuarios);
