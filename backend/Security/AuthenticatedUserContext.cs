namespace Alafe.Api.Security;

public sealed record AuthenticatedUserContext(int UsuarioId, int PropietarioId, int RolId,
    bool EsPropietario, int TokenVersion, string Correo)
{
    public const string HttpContextItemKey = "Alafe.AuthenticatedUserContext";
}
