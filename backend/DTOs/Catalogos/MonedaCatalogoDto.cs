namespace Alafe.Api.DTOs.Catalogos;

public sealed record MonedaCatalogoDto(string Codigo, string Nombre, string Simbolo,
    bool HabilitadaEnAgenda, bool HabilitadaEnMovimiento);
