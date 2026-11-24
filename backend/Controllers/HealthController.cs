using Microsoft.AspNetCore.Mvc;

namespace Alafe.Api.Controllers;

/// <summary>
/// Endpoint básico de verificación de estado del servicio.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "ok" });
    }
}
