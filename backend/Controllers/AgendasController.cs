using Alafe.Api.DTOs.Configuracion;
using Alafe.Api.Security;
using Alafe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alafe.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/agendas")]
public sealed class AgendasController(IConfiguracionService configuracion) : ControllerBase
{
    [HttpGet("{agendaId:int}/configuracion")]
    public async Task<ActionResult<ConfiguracionOperativaAgendaDto>> GetConfiguracion(int agendaId, CancellationToken ct) =>
        Ok(await configuracion.GetConfiguracionAgendaAsync(agendaId, ct));

    [HttpPut("{agendaId:int}/configuracion"), RequirePermission("config.agenda.editar")]
    public async Task<ActionResult<ConfiguracionOperativaAgendaDto>> UpdateConfiguracion(int agendaId, ActualizarConfiguracionOperativaAgendaRequest request, CancellationToken ct) =>
        Ok(await configuracion.UpdateConfiguracionAgendaAsync(agendaId, request, ct));
}
