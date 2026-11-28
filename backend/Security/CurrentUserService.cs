using System.Security.Claims;

namespace Alafe.Api.Security;

public sealed class CurrentUserService(IHttpContextAccessor accessor) : ICurrentUserService
{
    private HttpContext? Context => accessor.HttpContext;
    private ClaimsPrincipal? User => accessor.HttpContext?.User;
    private AuthenticatedUserContext? VerifiedContext => Context?.Items.TryGetValue(AuthenticatedUserContext.HttpContextItemKey, out var value) == true
        ? value as AuthenticatedUserContext : null;
    public int? UsuarioId => VerifiedContext?.UsuarioId ?? ReadInt("sub", ClaimTypes.NameIdentifier);
    public int? PropietarioId => VerifiedContext?.PropietarioId;
    public int? RolId => VerifiedContext?.RolId;
    public bool EsPropietario => VerifiedContext?.EsPropietario ?? false;
    public int? TokenVersion => VerifiedContext?.TokenVersion ?? ReadInt("tv");
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;
    private int? ReadInt(params string[] types)
    {
        foreach (var type in types)
            if (int.TryParse(User?.FindFirst(type)?.Value, out var value)) return value;
        return null;
    }
}
