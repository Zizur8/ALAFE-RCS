using Alafe.Api.DTOs.Configuracion;
using Alafe.Api.Security;
using Alafe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alafe.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/configuracion")]
public sealed class ConfiguracionController(IConfiguracionService configuracion) : ControllerBase
{
    [HttpGet("global")]
    public async Task<ActionResult<ConfiguracionPropietarioDto>> GetGlobal(CancellationToken ct) =>
        Ok(await configuracion.GetConfiguracionGlobalAsync(ct));

    [HttpPut("global"), RequirePermission("config.cuenta.editar")]
    public async Task<ActionResult<ConfiguracionPropietarioDto>> UpdateGlobal(ActualizarConfiguracionPropietarioRequest request, CancellationToken ct) =>
        Ok(await configuracion.UpdateConfiguracionGlobalAsync(request, ct));

    [HttpGet("general"), RequirePermission("config.cuenta.editar")]
    public async Task<ActionResult<ConfiguracionGeneralDto>> GetGeneral(CancellationToken ct) =>
        Ok(await configuracion.GetGeneralAsync(ct));

    [HttpPut("general"), RequirePermission("config.cuenta.editar")]
    public async Task<ActionResult<ConfiguracionGeneralDto>> UpdateGeneral(ActualizarConfiguracionGeneralRequest request, CancellationToken ct) =>
        Ok(await configuracion.UpdateGeneralAsync(request, ct));

    [HttpGet("agendas"), RequirePermission("agendas.administrar")]
    public async Task<ActionResult<IReadOnlyList<AgendaConfigDto>>> GetAgendas(CancellationToken ct) =>
        Ok(await configuracion.GetAgendasAsync(ct));

    [HttpPost("agendas"), RequirePermission("agendas.administrar")]
    public async Task<ActionResult<AgendaConfigDto>> CreateAgenda(GuardarAgendaRequest request, CancellationToken ct)
    {
        var created = await configuracion.CreateAgendaAsync(request, ct);
        return Created("/api/configuracion/agendas", created);
    }

    [HttpPut("agendas/{id:int}"), RequirePermission("agendas.administrar")]
    public async Task<ActionResult<AgendaConfigDto>> UpdateAgenda(int id, GuardarAgendaRequest request, CancellationToken ct) =>
        Ok(await configuracion.UpdateAgendaAsync(id, request, ct));
}
