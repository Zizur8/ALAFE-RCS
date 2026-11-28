namespace Alafe.Api.Models;

public sealed class ClienteEtiqueta
{
    public int ClienteId { get; set; }
    public int EtiquetaId { get; set; }
    public Cliente? Cliente { get; set; }
    public EtiquetaCliente? Etiqueta { get; set; }
}
