using System.ComponentModel.DataAnnotations;
using Alafe.Api.DTOs.Usuarios;

namespace Alafe.Api.DTOs.Clientes;

public sealed record EtiquetaResumenDto(int Id, string Nombre, string Tono);
public sealed record EtiquetaClienteDto(int Id, string Nombre, string? Descripcion, string Tono, bool Activo, int TotalClientes);
public sealed record ClientesEstadisticasDto(int TotalClientes, int Activos, int Inactivos);
public sealed record ClientesPaginadosDto(IReadOnlyList<ClienteDto> Items, int Pagina, int TamanoPagina, int TotalItems, int TotalPaginas, bool TieneAnterior, bool TieneSiguiente, ClientesEstadisticasDto Estadisticas);
public sealed record ClienteDto(int Id, string NombreCompleto, string TelefonoPaisCodigo, string Telefono, string? Correo, string? Direccion, string? Notas, bool Activo, DateTime FechaCreacion, int TotalEventos, DateTime? UltimoEventoFecha, decimal SaldoPendiente, IReadOnlyList<AgendaResumenDto> AgendasVinculadas, IReadOnlyList<EtiquetaResumenDto> Etiquetas);
public sealed record ClienteEventoResumenDto(int Id, string Titulo, string AgendaNombre, DateTime FechaInicio, DateTime FechaFin, string Estado, decimal MontoTotal, decimal SaldoPendiente, string MonedaCodigo);
public sealed record ClienteEventosPaginadosDto(int ClienteId, string ClienteNombre, IReadOnlyList<ClienteEventoResumenDto> Items, int Pagina, int TamanoPagina, int TotalItems, int TotalPaginas, bool TieneAnterior, bool TieneSiguiente);

public sealed class CrearEtiquetaClienteRequest
{
    [Required, StringLength(60, MinimumLength = 1)] public string Nombre { get; init; } = "";
    [StringLength(200)] public string? Descripcion { get; init; }
    [Required, StringLength(20)] public string Tono { get; init; } = "neutral";
}
public sealed class ActualizarEtiquetaClienteRequest
{
    [Required, StringLength(60, MinimumLength = 1)] public string Nombre { get; init; } = "";
    [StringLength(200)] public string? Descripcion { get; init; }
    [Required, StringLength(20)] public string Tono { get; init; } = "neutral";
    public bool Activo { get; init; }
}
public sealed class CrearClienteRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string NombreCompleto { get; init; } = "";
    [Required, StringLength(2, MinimumLength = 2)] public string TelefonoPaisCodigo { get; init; } = "MX";
    [Required, StringLength(30, MinimumLength = 4)] public string Telefono { get; init; } = "";
    [EmailAddress, StringLength(180)] public string? Correo { get; init; }
    [StringLength(250)] public string? Direccion { get; init; }
    [StringLength(500)] public string? Notas { get; init; }
    public List<int>? EtiquetaIds { get; init; }
}
public sealed class ActualizarClienteRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string NombreCompleto { get; init; } = "";
    [Required, StringLength(2, MinimumLength = 2)] public string TelefonoPaisCodigo { get; init; } = "MX";
    [Required, StringLength(30, MinimumLength = 4)] public string Telefono { get; init; } = "";
    [EmailAddress, StringLength(180)] public string? Correo { get; init; }
    [StringLength(250)] public string? Direccion { get; init; }
    [StringLength(500)] public string? Notas { get; init; }
    public bool Activo { get; init; }
    public List<int>? EtiquetaIds { get; init; }
}
