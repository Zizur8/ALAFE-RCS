using Microsoft.EntityFrameworkCore;
using Alafe.Api.Models;

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

    public DbSet<Moneda> Monedas => Set<Moneda>();
    public DbSet<Pais> Paises => Set<Pais>();
    public DbSet<Plan> Planes => Set<Plan>();
    public DbSet<Permiso> Permisos => Set<Permiso>();
    public DbSet<Propietario> Propietarios => Set<Propietario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<RolPermiso> RolPermisos => Set<RolPermiso>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Agenda> Agendas => Set<Agenda>();
    public DbSet<UsuarioAgenda> UsuarioAgendas => Set<UsuarioAgenda>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplica automáticamente todas las IEntityTypeConfiguration<T> del ensamblado.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AlafeDbContext).Assembly);
    }
}
