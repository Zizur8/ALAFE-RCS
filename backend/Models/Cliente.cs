namespace Alafe.Api.Models;

public sealed class Cliente
{
    public int Id { get; set; }
    public int PropietarioId { get; set; }
    public string NombreCompleto { get; set; } = "";
    public string TelefonoPaisCodigo { get; set; } = "MX";
    public string Telefono { get; set; } = "";
    public string? Correo { get; set; }
    public string? Direccion { get; set; }
    public string? Notas { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaActualizacion { get; set; }
    public Propietario? Propietario { get; set; }
    public Pais? TelefonoPais { get; set; }
    public ICollection<ClienteEtiqueta> ClienteEtiquetas { get; set; } = new List<ClienteEtiqueta>();
}
