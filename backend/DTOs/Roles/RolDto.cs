namespace Alafe.Api.DTOs.Roles;

public sealed record RolDto(int Id, string Nombre, string? Descripcion, bool EsSistema, bool Activo,
    int TotalUsuarios, IReadOnlyList<string> Permisos);
