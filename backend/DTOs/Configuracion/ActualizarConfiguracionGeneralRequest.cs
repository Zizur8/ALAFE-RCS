using System.ComponentModel.DataAnnotations;

namespace Alafe.Api.DTOs.Configuracion;

public sealed class ActualizarConfiguracionGeneralRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string NombreEspacioTrabajo { get; init; } = "";
    [Required, StringLength(2, MinimumLength = 2), RegularExpression("^[A-Za-z]{2}$")] public string PaisCodigo { get; init; } = "";
    [Required, StringLength(2, MinimumLength = 2), RegularExpression("^[A-Za-z]{2}$")] public string TelefonoPaisCodigo { get; init; } = "";
    [Required, StringLength(20, MinimumLength = 10)] public string TelefonoContacto { get; init; } = "";
    [Required, RegularExpression("^(claro|oscuro)$")] public string TemaVisualUsuario { get; init; } = "claro";
    [Required, RegularExpression("^(mes|lista)$")] public string VistaAgendaDefaultUsuario { get; init; } = "mes";
}
