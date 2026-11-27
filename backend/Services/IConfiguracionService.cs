using Alafe.Api.DTOs.Configuracion;

namespace Alafe.Api.Services;

public interface IConfiguracionService
{
    Task<ConfiguracionGeneralDto> GetGeneralAsync(CancellationToken cancellationToken = default);
    Task<ConfiguracionGeneralDto> UpdateGeneralAsync(ActualizarConfiguracionGeneralRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AgendaConfigDto>> GetAgendasAsync(CancellationToken cancellationToken = default);
    Task<AgendaConfigDto> CreateAgendaAsync(GuardarAgendaRequest request, CancellationToken cancellationToken = default);
    Task<AgendaConfigDto> UpdateAgendaAsync(int agendaId, GuardarAgendaRequest request, CancellationToken cancellationToken = default);
}
