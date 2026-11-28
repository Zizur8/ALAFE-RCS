using Alafe.Api.DTOs.Usuarios;

namespace Alafe.Api.Services;

public interface IUsuarioService
{
    Task<UsuariosPaginadosDto> GetUsuariosAsync(int pagina, int tamanoPagina, string? busqueda, bool? activo,
        int? rolId, CancellationToken cancellationToken = default);
    Task<UsuarioDto> CreateUsuarioAsync(CrearUsuarioRequest request, CancellationToken cancellationToken = default);
    Task<UsuarioDto> UpdateUsuarioAsync(int usuarioId, ActualizarUsuarioRequest request, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(int usuarioId, CambiarPasswordUsuarioRequest request, CancellationToken cancellationToken = default);
}
