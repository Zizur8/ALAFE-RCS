using Alafe.Api.Data;
using Alafe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Alafe.Api.Security;

public sealed class AgendaAccessService(AlafeDbContext db, ICurrentUserService currentUser) : IAgendaAccessService
{
    public IQueryable<Agenda> QueryAccessibleAgendas()
    {
        var ownerId = currentUser.PropietarioId;
        var userId = currentUser.UsuarioId;
        if (!currentUser.IsAuthenticated || ownerId is null) return db.Agendas.Where(_ => false);
        var query = db.Agendas.AsNoTracking().Where(a => a.PropietarioId == ownerId && a.Activo);
        return currentUser.EsPropietario || userId is null
            ? currentUser.EsPropietario ? query : db.Agendas.Where(_ => false)
            : query.Where(a => db.UsuarioAgendas.Any(ua => ua.UsuarioId == userId && ua.AgendaId == a.Id));
    }

    public IQueryable<Agenda> QueryAccessibleAgendas(int usuarioId)
    {
        var user = db.Usuarios.AsNoTracking().Where(u => u.Id == usuarioId && u.Activo && u.Propietario != null && u.Propietario.Activo);
        return db.Agendas.AsNoTracking().Where(a => a.Activo && user.Any(u => u.PropietarioId == a.PropietarioId &&
            (u.EsPropietario || db.UsuarioAgendas.Any(ua => ua.UsuarioId == u.Id && ua.AgendaId == a.Id))));
    }

    public Task<bool> CanAccessAsync(int agendaId, CancellationToken cancellationToken = default) =>
        QueryAccessibleAgendas().AnyAsync(a => a.Id == agendaId, cancellationToken);
}
