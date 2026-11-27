using System.Security.Claims;

namespace Alafe.Api.Security;

public sealed class CurrentUserService(IHttpContextAccessor accessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => accessor.HttpContext?.User;
    public int? UsuarioId => ReadInt(ClaimTypes.NameIdentifier, "sub");
    public int? PropietarioId => ReadInt("propietarioId");
    public int? RolId => ReadInt("rolId");
    public bool EsPropietario => bool.TryParse(User?.FindFirst("esPropietario")?.Value, out var value) && value;
    public int? TokenVersion => ReadInt("tokenVersion");
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;
    private int? ReadInt(params string[] types)
    {
        foreach (var type in types)
            if (int.TryParse(User?.FindFirst(type)?.Value, out var value)) return value;
        return null;
    }
}
