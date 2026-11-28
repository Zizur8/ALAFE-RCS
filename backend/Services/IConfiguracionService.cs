using Alafe.Api.DTOs.Configuracion;

namespace Alafe.Api.Services;

public interface IConfiguracionService
{
    Task<ConfiguracionPropietarioDto> GetConfiguracionGlobalAsync(CancellationToken cancellationToken = default);
    Task<ConfiguracionPropietarioDto> UpdateConfiguracionGlobalAsync(ActualizarConfiguracionPropietarioRequest request, CancellationToken cancellationToken = default);
    Task<ConfiguracionOperativaAgendaDto> GetConfiguracionAgendaAsync(int agendaId, CancellationToken cancellationToken = default);
    Task<ConfiguracionOperativaAgendaDto> UpdateConfiguracionAgendaAsync(int agendaId, ActualizarConfiguracionOperativaAgendaRequest request, CancellationToken cancellationToken = default);
    Task<ConfiguracionGeneralDto> GetGeneralAsync(CancellationToken cancellationToken = default);
    Task<ConfiguracionGeneralDto> UpdateGeneralAsync(ActualizarConfiguracionGeneralRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AgendaConfigDto>> GetAgendasAsync(CancellationToken cancellationToken = default);
    Task<AgendaConfigDto> CreateAgendaAsync(GuardarAgendaRequest request, CancellationToken cancellationToken = default);
    Task<AgendaConfigDto> UpdateAgendaAsync(int agendaId, GuardarAgendaRequest request, CancellationToken cancellationToken = default);
}
