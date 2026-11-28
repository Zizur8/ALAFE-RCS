using Alafe.Api.DTOs.Clientes;
using Alafe.Api.Security;
using Alafe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alafe.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/clientes")]
public sealed class ClientesController(IClienteService clientes) : ControllerBase
{
    [HttpGet, RequirePermission("clientes.consultar")]
    public async Task<ActionResult<ClientesPaginadosDto>> GetClientes([FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20,
        [FromQuery] string? busqueda = null, [FromQuery] bool? activo = null, [FromQuery] int? etiquetaId = null, CancellationToken ct = default)
    {
        pagina = Math.Max(1, pagina); tamanoPagina = Math.Clamp(tamanoPagina, 1, 100);
        return Ok(await clientes.GetClientesAsync(pagina, tamanoPagina, busqueda, activo, etiquetaId, ct));
    }

    [HttpPost, RequirePermission("clientes.gestionar")]
    public async Task<ActionResult<ClienteDto>> CreateCliente(CrearClienteRequest request, CancellationToken ct) =>
        Created("/api/clientes", await clientes.CreateClienteAsync(request, ct));

    [HttpPut("{id:int}"), RequirePermission("clientes.gestionar")]
    public async Task<ActionResult<ClienteDto>> UpdateCliente(int id, ActualizarClienteRequest request, CancellationToken ct) =>
        Ok(await clientes.UpdateClienteAsync(id, request, ct));

    [HttpDelete("{id:int}"), RequirePermission("clientes.gestionar")]
    public async Task<IActionResult> DeleteCliente(int id, CancellationToken cancellationToken)
    {
        await clientes.EliminarAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:int}/eventos"), RequirePermission("clientes.consultar")]
    public async Task<ActionResult<ClienteEventosPaginadosDto>> GetEventos(int id, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20, CancellationToken ct = default)
    {
        pagina = Math.Max(1, pagina); tamanoPagina = Math.Clamp(tamanoPagina, 1, 100);
        return Ok(await clientes.GetEventosAsync(id, pagina, tamanoPagina, ct));
    }

    [HttpGet("etiquetas"), RequirePermission("clientes.consultar")]
    public async Task<ActionResult<IReadOnlyList<EtiquetaClienteDto>>> GetEtiquetas(CancellationToken ct) => Ok(await clientes.GetEtiquetasAsync(ct));

    [HttpPost("etiquetas"), RequirePermission("clientes.gestionar")]
    public async Task<ActionResult<EtiquetaClienteDto>> CreateEtiqueta(CrearEtiquetaClienteRequest request, CancellationToken ct) =>
        Created("/api/clientes/etiquetas", await clientes.CreateEtiquetaAsync(request, ct));

    [HttpPut("etiquetas/{id:int}"), RequirePermission("clientes.gestionar")]
    public async Task<ActionResult<EtiquetaClienteDto>> UpdateEtiqueta(int id, ActualizarEtiquetaClienteRequest request, CancellationToken ct) =>
        Ok(await clientes.UpdateEtiquetaAsync(id, request, ct));

    [HttpDelete("etiquetas/{id:int}"), RequirePermission("clientes.gestionar")]
    public async Task<IActionResult> DeleteEtiqueta(int id, CancellationToken ct)
    {
        await clientes.DeleteEtiquetaAsync(id, ct);
        return NoContent();
    }
}
