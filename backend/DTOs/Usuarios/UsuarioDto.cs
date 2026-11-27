namespace Alafe.Api.DTOs.Usuarios;

public sealed record UsuarioDto(int Id, string NombreCompleto, string Correo, string TelefonoPaisCodigo,
    string Telefono, bool EsPropietario, bool Activo, int RolId, string RolNombre, DateTime? UltimoAcceso,
    IReadOnlyList<AgendaResumenDto> Agendas);
