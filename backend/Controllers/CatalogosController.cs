using Alafe.Api.Data;
using Alafe.Api.DTOs.Catalogos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Alafe.Api.Controllers;

[ApiController]
[Route("api/catalogos")]
[AllowAnonymous]
public sealed class CatalogosController(AlafeDbContext db) : ControllerBase
{
    [HttpGet("planes")]
    public async Task<ActionResult<IReadOnlyList<PlanCatalogoDto>>> Planes(CancellationToken ct) =>
        Ok(await db.Planes.AsNoTracking().Where(p => p.Activo).OrderBy(p => p.OrdenVisual)
            .Select(p => new PlanCatalogoDto(p.Id, p.Codigo, p.Nombre, p.Descripcion, p.PrecioMensual, p.MonedaCodigo,
                p.LimiteAgendas, p.LimiteUsuarios, p.IncluyeMovimientos, p.IncluyeReportes, p.IncluyeInventario)).ToListAsync(ct));

    [HttpGet("paises")]
    public async Task<ActionResult<IReadOnlyList<PaisCatalogoDto>>> Paises(CancellationToken ct) =>
        Ok(await db.Paises.AsNoTracking().Where(p => p.Activo).OrderBy(p => p.Nombre)
            .Select(p => new PaisCatalogoDto(p.Codigo, p.Nombre, p.CodigoLada, p.MonedaDefaultCodigo)).ToListAsync(ct));

    [HttpGet("monedas")]
    public async Task<ActionResult<IReadOnlyList<MonedaCatalogoDto>>> Monedas([FromQuery] bool soloAgenda = false, CancellationToken ct = default) =>
        Ok(await db.Monedas.AsNoTracking().Where(m => m.Activo && (!soloAgenda || m.HabilitadaEnAgenda)).OrderBy(m => m.Codigo)
            .Select(m => new MonedaCatalogoDto(m.Codigo, m.Nombre, m.Simbolo, m.HabilitadaEnAgenda, m.HabilitadaEnMovimiento)).ToListAsync(ct));
}
