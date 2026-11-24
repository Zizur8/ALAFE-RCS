using Microsoft.EntityFrameworkCore;

namespace Alafe.Api.Data;

/// <summary>
/// Contexto base de EF Core para ALAFE.
/// Las configuraciones de entidades se aplican mediante IEntityTypeConfiguration&lt;T&gt;
/// registradas en Data/ (o en cualquier ensamblado referenciado).
/// </summary>
public class AlafeDbContext : DbContext
{
    public AlafeDbContext(DbContextOptions<AlafeDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplica automáticamente todas las IEntityTypeConfiguration<T> del ensamblado.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AlafeDbContext).Assembly);
    }
}
