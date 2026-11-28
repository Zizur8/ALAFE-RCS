using System.Data;
using Alafe.Api.Data;
using Alafe.Api.DTOs.Clientes;
using Alafe.Api.DTOs.Usuarios;
using Alafe.Api.Models;
using Alafe.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace Alafe.Api.Services;

public sealed class ClienteService(AlafeDbContext db, ICurrentUserService currentUser) : IClienteService
{
    private static readonly HashSet<string> Tonos = new(StringComparer.OrdinalIgnoreCase) { "accent", "success", "warning", "danger", "info", "neutral" };
    private int OwnerId => currentUser.PropietarioId ?? throw new UnauthorizedAccessException("La sesión no contiene un propietario válido.");

    public async Task<ClientesPaginadosDto> GetClientesAsync(int pagina, int tamanoPagina, string? busqueda, bool? activo, int? etiquetaId, CancellationToken ct = default)
    {
        var ownerId = OwnerId;
        var owned = db.Clientes.AsNoTracking().Where(c => c.PropietarioId == ownerId);
        var stats = await owned.GroupBy(c => c.PropietarioId).Select(g => new { Total = g.Count(), Activos = g.Sum(c => c.Activo ? 1 : 0) }).SingleOrDefaultAsync(ct);
        var estadisticas = new ClientesEstadisticasDto(stats?.Total ?? 0, stats?.Activos ?? 0, (stats?.Total ?? 0) - (stats?.Activos ?? 0));
        var query = owned;
        var term = busqueda?.Trim();
        if (!string.IsNullOrEmpty(term)) query = query.Where(c => c.NombreCompleto.Contains(term) || c.Telefono.Contains(term) || (c.Correo != null && c.Correo.Contains(term)) || (c.Direccion != null && c.Direccion.Contains(term)));
        if (activo.HasValue) query = query.Where(c => c.Activo == activo.Value);
        if (etiquetaId.HasValue) query = query.Where(c => c.ClienteEtiquetas.Any(ce => ce.EtiquetaId == etiquetaId.Value && ce.Etiqueta != null && ce.Etiqueta.PropietarioId == ownerId));
        var totalItems = await query.CountAsync(ct);
        var totalPaginas = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)tamanoPagina);
        pagina = totalPaginas == 0 ? 1 : Math.Min(pagina, totalPaginas);
        var page = await query.OrderByDescending(c => c.Activo).ThenBy(c => c.NombreCompleto).ThenBy(c => c.Id)
            .Skip((pagina - 1) * tamanoPagina).Take(tamanoPagina)
            .Select(c => new { Cliente = c, Etiquetas = c.ClienteEtiquetas.Where(ce => ce.Etiqueta != null && ce.Etiqueta.PropietarioId == ownerId).Select(ce => new EtiquetaResumenDto(ce.Etiqueta!.Id, ce.Etiqueta.Nombre, ce.Etiqueta.Tono)).ToList() })
            .ToListAsync(ct);
        var items = page.Select(x => ToDto(x.Cliente, x.Etiquetas)).ToArray();
        return new ClientesPaginadosDto(items, pagina, tamanoPagina, totalItems, totalPaginas, pagina > 1, pagina < totalPaginas, estadisticas);
    }

    public async Task<ClienteDto> CreateClienteAsync(CrearClienteRequest request, CancellationToken ct = default)
    {
        var ownerId = OwnerId;
        var country = request.TelefonoPaisCodigo.Trim().ToUpperInvariant();
        await EnsurePhoneCountryAsync(country, ct);
        var tagIds = await ValidateTagsAsync(ownerId, request.EtiquetaIds, ct);
        var cliente = new Cliente { PropietarioId = ownerId, NombreCompleto = request.NombreCompleto.Trim(), TelefonoPaisCodigo = country, Telefono = request.Telefono.Trim(), Correo = NormalizeOptional(request.Correo), Direccion = NormalizeOptional(request.Direccion), Notas = NormalizeOptional(request.Notas), Activo = true, FechaCreacion = DateTime.UtcNow };
        db.Clientes.Add(cliente);
        await db.SaveChangesAsync(ct);
        db.ClienteEtiquetas.AddRange(tagIds.Select(id => new ClienteEtiqueta { ClienteId = cliente.Id, EtiquetaId = id }));
        await db.SaveChangesAsync(ct);
        return await GetClienteDtoAsync(ownerId, cliente.Id, ct);
    }

    public async Task<ClienteDto> UpdateClienteAsync(int id, ActualizarClienteRequest request, CancellationToken ct = default)
    {
        var ownerId = OwnerId;
        var cliente = await db.Clientes.SingleOrDefaultAsync(c => c.Id == id && c.PropietarioId == ownerId, ct) ?? throw new KeyNotFoundException("El cliente no existe en este espacio de trabajo.");
        var country = request.TelefonoPaisCodigo.Trim().ToUpperInvariant();
        await EnsurePhoneCountryAsync(country, ct);
        var tagIds = await ValidateTagsAsync(ownerId, request.EtiquetaIds, ct);
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        cliente.NombreCompleto = request.NombreCompleto.Trim(); cliente.TelefonoPaisCodigo = country; cliente.Telefono = request.Telefono.Trim();
        cliente.Correo = NormalizeOptional(request.Correo); cliente.Direccion = NormalizeOptional(request.Direccion); cliente.Notas = NormalizeOptional(request.Notas);
        cliente.Activo = request.Activo; cliente.FechaActualizacion = DateTime.UtcNow;
        if (request.EtiquetaIds is not null)
        {
            var existing = await db.ClienteEtiquetas.Where(ce => ce.ClienteId == id && ce.Cliente != null && ce.Cliente.PropietarioId == ownerId).ToListAsync(ct);
            var wanted = tagIds.ToHashSet();
            db.ClienteEtiquetas.RemoveRange(existing.Where(ce => !wanted.Contains(ce.EtiquetaId)));
            var current = existing.Select(ce => ce.EtiquetaId).ToHashSet();
            db.ClienteEtiquetas.AddRange(tagIds.Where(tagId => !current.Contains(tagId)).Select(tagId => new ClienteEtiqueta { ClienteId = id, EtiquetaId = tagId }));
        }
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return await GetClienteDtoAsync(ownerId, id, ct);
    }

    public async Task EliminarAsync(int id, CancellationToken cancellationToken = default)
    {
        var propietarioId = OwnerId;
        var cliente = await db.Clientes.SingleOrDefaultAsync(c => c.Id == id && c.PropietarioId == propietarioId, cancellationToken)
            ?? throw new KeyNotFoundException("El cliente no existe en este espacio de trabajo.");

        var eventosAsociados = await ContarEventosAsociadosAsync(propietarioId, cliente.Id, cancellationToken);
        if (eventosAsociados > 0)
            throw new ConflictException("No se puede eliminar el cliente porque tiene eventos asociados. Puedes desactivarlo para conservar su historial.");

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        var relaciones = await db.ClienteEtiquetas
            .Where(ce => ce.ClienteId == cliente.Id && ce.Cliente != null && ce.Cliente.PropietarioId == propietarioId)
            .ToListAsync(cancellationToken);
        db.ClienteEtiquetas.RemoveRange(relaciones);
        db.Clientes.Remove(cliente);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
    }

    private Task<int> ContarEventosAsociadosAsync(int propietarioId, int clienteId, CancellationToken cancellationToken)
    {
        // TODO: consultar la tabla Eventos filtrando por PropietarioId y ClienteId cuando se implemente la entidad Eventos.
        return Task.FromResult(0);
    }

    public async Task<ClienteEventosPaginadosDto> GetEventosAsync(int id, int pagina, int tamanoPagina, CancellationToken ct = default)
    {
        var ownerId = OwnerId;
        var cliente = await db.Clientes.AsNoTracking().Where(c => c.Id == id && c.PropietarioId == ownerId).Select(c => new { c.Id, c.NombreCompleto }).SingleOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("El cliente no existe en este espacio de trabajo.");
        // TODO: conectar aquí la consulta paginada de Eventos cuando se implemente esa entidad y su esquema.
        return new ClienteEventosPaginadosDto(cliente.Id, cliente.NombreCompleto, Array.Empty<ClienteEventoResumenDto>(), pagina, tamanoPagina, 0, 0, false, false);
    }

    public async Task<IReadOnlyList<EtiquetaClienteDto>> GetEtiquetasAsync(CancellationToken ct = default)
    {
        var ownerId = OwnerId;
        return await db.EtiquetasCliente.AsNoTracking().Where(e => e.PropietarioId == ownerId).OrderBy(e => e.Nombre)
            .Select(e => new EtiquetaClienteDto(e.Id, e.Nombre, e.Descripcion, e.Tono, e.Activo, e.ClienteEtiquetas.Count(ce => ce.Cliente != null && ce.Cliente.PropietarioId == ownerId))).ToListAsync(ct);
    }

    public async Task<EtiquetaClienteDto> CreateEtiquetaAsync(CrearEtiquetaClienteRequest request, CancellationToken ct = default)
    {
        var ownerId = OwnerId; var name = request.Nombre.Trim(); var tone = NormalizeTone(request.Tono);
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        if (await db.EtiquetasCliente.AnyAsync(e => e.PropietarioId == ownerId && e.Nombre == name, ct)) throw new ConflictException("Ya existe una etiqueta con ese nombre.");
        var entity = new EtiquetaCliente { PropietarioId = ownerId, Nombre = name, Descripcion = NormalizeOptional(request.Descripcion), Tono = tone, Activo = true, FechaCreacion = DateTime.UtcNow };
        db.EtiquetasCliente.Add(entity); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        return new EtiquetaClienteDto(entity.Id, entity.Nombre, entity.Descripcion, entity.Tono, entity.Activo, 0);
    }

    public async Task<EtiquetaClienteDto> UpdateEtiquetaAsync(int id, ActualizarEtiquetaClienteRequest request, CancellationToken ct = default)
    {
        var ownerId = OwnerId; var entity = await db.EtiquetasCliente.SingleOrDefaultAsync(e => e.Id == id && e.PropietarioId == ownerId, ct) ?? throw new KeyNotFoundException("La etiqueta no existe en este espacio de trabajo.");
        var name = request.Nombre.Trim(); var tone = NormalizeTone(request.Tono);
        await using var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        if (await db.EtiquetasCliente.AnyAsync(e => e.PropietarioId == ownerId && e.Id != id && e.Nombre == name, ct)) throw new ConflictException("Ya existe una etiqueta con ese nombre.");
        entity.Nombre = name; entity.Descripcion = NormalizeOptional(request.Descripcion); entity.Tono = tone; entity.Activo = request.Activo;
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        var total = await db.ClienteEtiquetas.CountAsync(ce => ce.EtiquetaId == id && ce.Cliente != null && ce.Cliente.PropietarioId == ownerId, ct);
        return new EtiquetaClienteDto(entity.Id, entity.Nombre, entity.Descripcion, entity.Tono, entity.Activo, total);
    }

    public async Task DeleteEtiquetaAsync(int id, CancellationToken ct = default)
    {
        var ownerId = OwnerId;
        var entity = await db.EtiquetasCliente.SingleOrDefaultAsync(e => e.Id == id && e.PropietarioId == ownerId, ct) ?? throw new KeyNotFoundException("La etiqueta no existe en este espacio de trabajo.");
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var relations = await db.ClienteEtiquetas.Where(ce => ce.EtiquetaId == id && ce.Cliente != null && ce.Cliente.PropietarioId == ownerId).ToListAsync(ct);
        db.ClienteEtiquetas.RemoveRange(relations); db.EtiquetasCliente.Remove(entity);
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
    }

    private async Task<ClienteDto> GetClienteDtoAsync(int ownerId, int id, CancellationToken ct)
    {
        var row = await db.Clientes.AsNoTracking().Where(c => c.Id == id && c.PropietarioId == ownerId)
            .Select(c => new { Cliente = c, Etiquetas = c.ClienteEtiquetas.Where(ce => ce.Etiqueta != null && ce.Etiqueta.PropietarioId == ownerId).Select(ce => new EtiquetaResumenDto(ce.Etiqueta!.Id, ce.Etiqueta.Nombre, ce.Etiqueta.Tono)).ToList() }).SingleAsync(ct);
        return ToDto(row.Cliente, row.Etiquetas);
    }

    private static ClienteDto ToDto(Cliente c, IReadOnlyList<EtiquetaResumenDto> tags) => new(c.Id, c.NombreCompleto, c.TelefonoPaisCodigo, c.Telefono, c.Correo, c.Direccion, c.Notas, c.Activo, c.FechaCreacion, 0, null, 0m, Array.Empty<AgendaResumenDto>(), tags);
    private async Task EnsurePhoneCountryAsync(string code, CancellationToken ct)
    {
        var country = await db.Paises.AsNoTracking().SingleOrDefaultAsync(p => p.Codigo == code, ct) ?? throw new ArgumentException("El país del teléfono no existe.");
        if (!country.Activo) throw new ArgumentException("El país del teléfono no está activo.");
    }
    private async Task<List<int>> ValidateTagsAsync(int ownerId, IReadOnlyCollection<int>? ids, CancellationToken ct)
    {
        var distinct = (ids ?? Array.Empty<int>()).Distinct().ToList();
        if (distinct.Count == 0) return distinct;
        var count = await db.EtiquetasCliente.CountAsync(e => e.PropietarioId == ownerId && e.Activo && distinct.Contains(e.Id), ct);
        if (count != distinct.Count) throw new ArgumentException("Una o más etiquetas no pertenecen a este espacio de trabajo o no están activas.");
        return distinct;
    }
    private static string NormalizeTone(string? tone)
    {
        var normalized = tone?.Trim().ToLowerInvariant() ?? "";
        if (!Tonos.Contains(normalized)) throw new ArgumentException("El tono debe ser accent, success, warning, danger, info o neutral.");
        return normalized;
    }
    private static string? NormalizeOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
