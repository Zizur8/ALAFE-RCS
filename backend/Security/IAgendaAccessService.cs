using Alafe.Api.Models;

namespace Alafe.Api.Security;

public interface IAgendaAccessService
{
    IQueryable<Agenda> QueryAccessibleAgendas();
    IQueryable<Agenda> QueryAccessibleAgendas(int usuarioId);
    Task<bool> CanAccessAsync(int agendaId, CancellationToken cancellationToken = default);
}
