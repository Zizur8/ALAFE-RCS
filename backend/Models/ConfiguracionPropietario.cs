namespace Alafe.Api.Models;

public sealed class ConfiguracionPropietario
{
    public int PropietarioId { get; set; }
    public string MonedaPredeterminadaCodigo { get; set; } = "MXN";
    public string FormatoFecha { get; set; } = "DD/MM/YYYY";
    public bool MostrarFinesDeSemanaPrimero { get; set; }
    public DateTime FechaActualizacion { get; set; }
    public Propietario? Propietario { get; set; }
    public Moneda? MonedaPredeterminada { get; set; }
}
