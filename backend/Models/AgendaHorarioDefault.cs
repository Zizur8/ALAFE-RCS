namespace Alafe.Api.Models;

public sealed class AgendaHorarioDefault
{
    public int AgendaId { get; set; }
    public byte DiaSemana { get; set; }
    public bool Activo { get; set; } = true;
    public TimeSpan HoraInicio { get; set; } = new(10, 0, 0);
    public TimeSpan HoraFin { get; set; } = new(22, 0, 0);
    public Agenda? Agenda { get; set; }

    public static List<AgendaHorarioDefault> CrearDefaults(Agenda agenda) =>
        Enumerable.Range(1, 7).Select(day => new AgendaHorarioDefault { Agenda = agenda, DiaSemana = (byte)day }).ToList();
}
