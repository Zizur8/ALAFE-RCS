namespace Alafe.Api.Models;
public class Permiso { public int Id { get; set; } public string Clave { get; set; } = ""; public string Modulo { get; set; } = ""; public string? Descripcion { get; set; } public ICollection<RolPermiso> RolPermisos { get; set; } = new List<RolPermiso>(); }
