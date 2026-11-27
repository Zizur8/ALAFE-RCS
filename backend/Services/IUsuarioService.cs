using Alafe.Api.DTOs.Usuarios;

namespace Alafe.Api.Services;

public interface IUsuarioService
{
    Task<IReadOnlyList<UsuarioDto>> GetUsuariosAsync(CancellationToken cancellationToken = default);
    Task<UsuarioDto> CreateUsuarioAsync(CrearUsuarioRequest request, CancellationToken cancellationToken = default);
    Task<UsuarioDto> UpdateUsuarioAsync(int usuarioId, ActualizarUsuarioRequest request, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(int usuarioId, CambiarPasswordUsuarioRequest request, CancellationToken cancellationToken = default);
}
