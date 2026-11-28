namespace Alafe.Api.DTOs.Configuracion;

public sealed record ConfiguracionPropietarioDto(int PropietarioId, string MonedaPredeterminadaCodigo,
    string FormatoFecha, bool MostrarFinesDeSemanaPrimero, DateTime FechaActualizacion);

public sealed class ActualizarConfiguracionPropietarioRequest
{
    public string MonedaPredeterminadaCodigo { get; init; } = "";
    public string FormatoFecha { get; init; } = "";
    public bool MostrarFinesDeSemanaPrimero { get; init; }
}

public sealed record ConfiguracionOperativaAgendaDto(int Id, string Nombre, string? NombreComercial,
    string MonedaCodigo, string ZonaHoraria, bool ExigirAnticipoParaConfirmar, bool PermitirTraslapes,
    string? NotaGeneral, bool MostrarNotaGeneral, IReadOnlyList<AgendaHorarioDefaultDto> HorariosPorDia);

public sealed record AgendaHorarioDefaultDto(byte DiaSemana, bool Activo, string HoraInicio, string HoraFin);

public sealed class ActualizarAgendaHorarioDefaultRequest
{
    public byte DiaSemana { get; init; }
    public bool Activo { get; init; }
    public string HoraInicio { get; init; } = "";
    public string HoraFin { get; init; } = "";
}

public sealed class ActualizarConfiguracionOperativaAgendaRequest
{
    public string? NombreComercial { get; init; }
    public string MonedaCodigo { get; init; } = "";
    public string ZonaHoraria { get; init; } = "";
    public bool ExigirAnticipoParaConfirmar { get; init; }
    public bool PermitirTraslapes { get; init; }
    public string? NotaGeneral { get; init; }
    public bool MostrarNotaGeneral { get; init; }
    public List<ActualizarAgendaHorarioDefaultRequest> HorariosPorDia { get; init; } = [];
}
