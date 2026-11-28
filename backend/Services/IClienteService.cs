using Alafe.Api.DTOs.Clientes;

namespace Alafe.Api.Services;

public interface IClienteService
{
    Task<ClientesPaginadosDto> GetClientesAsync(int pagina, int tamanoPagina, string? busqueda, bool? activo, int? etiquetaId, CancellationToken ct = default);
    Task<ClienteDto> CreateClienteAsync(CrearClienteRequest request, CancellationToken ct = default);
    Task<ClienteDto> UpdateClienteAsync(int id, ActualizarClienteRequest request, CancellationToken ct = default);
    Task EliminarAsync(int id, CancellationToken cancellationToken = default);
    Task<ClienteEventosPaginadosDto> GetEventosAsync(int id, int pagina, int tamanoPagina, CancellationToken ct = default);
    Task<IReadOnlyList<EtiquetaClienteDto>> GetEtiquetasAsync(CancellationToken ct = default);
    Task<EtiquetaClienteDto> CreateEtiquetaAsync(CrearEtiquetaClienteRequest request, CancellationToken ct = default);
    Task<EtiquetaClienteDto> UpdateEtiquetaAsync(int id, ActualizarEtiquetaClienteRequest request, CancellationToken ct = default);
    Task DeleteEtiquetaAsync(int id, CancellationToken ct = default);
}
