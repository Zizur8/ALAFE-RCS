namespace Alafe.Api.DTOs.Catalogos;

public sealed record PlanCatalogoDto(int Id, string Codigo, string Nombre, string? Descripcion,
    decimal PrecioMensual, string MonedaCodigo, int? LimiteAgendas, int? LimiteUsuarios,
    bool IncluyeMovimientos, bool IncluyeReportes, bool IncluyeInventario);
