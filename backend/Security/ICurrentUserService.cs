namespace Alafe.Api.Security;

public interface ICurrentUserService
{
    int? UsuarioId { get; }
    int? PropietarioId { get; }
    int? RolId { get; }
    bool EsPropietario { get; }
    int? TokenVersion { get; }
    bool IsAuthenticated { get; }
}
