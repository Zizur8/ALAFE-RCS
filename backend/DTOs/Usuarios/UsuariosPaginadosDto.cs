namespace Alafe.Api.DTOs.Usuarios;

public sealed record UsuariosPaginadosDto(
    IReadOnlyList<UsuarioDto> Items,
    int Pagina,
    int TamanoPagina,
    int TotalItems,
    int TotalPaginas,
    bool TieneAnterior,
    bool TieneSiguiente,
    UsuariosEstadisticasDto Estadisticas);
