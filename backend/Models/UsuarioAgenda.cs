namespace Alafe.Api.Models;
public class UsuarioAgenda { public int UsuarioId { get; set; } public int AgendaId { get; set; } public DateTime FechaAsignacion { get; set; } public Usuario? Usuario { get; set; } public Agenda? Agenda { get; set; } }
