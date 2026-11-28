namespace Alafe.Api.Models;

public sealed class EtiquetaCliente
{
    public int Id { get; set; }
    public int PropietarioId { get; set; }
    public string Nombre { get; set; } = "";
    public string? Descripcion { get; set; }
    public string Tono { get; set; } = "neutral";
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; }
    public Propietario? Propietario { get; set; }
    public ICollection<ClienteEtiqueta> ClienteEtiquetas { get; set; } = new List<ClienteEtiqueta>();
}
