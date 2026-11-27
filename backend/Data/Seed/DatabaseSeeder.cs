using Alafe.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Alafe.Api.Data.Seed;

public sealed class DatabaseSeeder(AlafeDbContext db, IPasswordHasher<Usuario> hasher, ILogger<DatabaseSeeder> logger)
{
    private static readonly (string Code,string Name,string Description)[] PermissionRows =
    [
        ("eventos.consultar","Eventos","Consultar agenda y eventos."),("eventos.crear","Eventos","Crear eventos."),("eventos.editar","Eventos","Editar eventos."),("eventos.eliminar","Eventos","Cancelar eventos."),
        ("clientes.consultar","Clientes","Consultar clientes."),("clientes.gestionar","Clientes","Gestionar clientes."),("usuarios.administrar","Usuarios","Administrar usuarios."),("permisos.administrar","Usuarios","Administrar roles y permisos."),("agendas.administrar","Configuracion","Administrar agendas."),("config.agenda.editar","Configuracion","Editar configuración de agenda."),("config.cuenta.editar","Configuracion","Editar cuenta y suscripción.")
    ];

    public async Task SeedAsync(bool development, CancellationToken cancellationToken = default)
    {
        await EnsureCatalogsAsync(cancellationToken);
        if (!development || await db.Propietarios.AnyAsync(cancellationToken)) return;

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        var plan = await db.Planes.SingleAsync(x => x.Codigo == "EMPRESARIAL", cancellationToken);
        var owner = new Propietario { PlanId=plan.Id, NombreEspacioTrabajo="Espacio Demo ALAFE", CorreoTitular="admin@alafe.local", PaisCodigo="MX", TelefonoPaisCodigo="MX", TelefonoContacto="8670000000", EstadoSuscripcion="Prueba", Activo=true, FechaInicioSuscripcion=DateTime.UtcNow, FechaCreacion=DateTime.UtcNow };
        db.Propietarios.Add(owner);
        await db.SaveChangesAsync(cancellationToken);

        var permisos = await db.Permisos.ToDictionaryAsync(x=>x.Clave, cancellationToken);
        var admin = new Rol { PropietarioId=owner.Id, Nombre="Administrador", Descripcion="Control total del espacio de trabajo.", EsSistema=true, Activo=true, FechaCreacion=DateTime.UtcNow };
        var receptionist = new Rol { PropietarioId=owner.Id, Nombre="Recepcionista", Descripcion="Operación diaria de eventos y clientes.", EsSistema=true, Activo=true, FechaCreacion=DateTime.UtcNow };
        db.Roles.AddRange(admin,receptionist);
        await db.SaveChangesAsync(cancellationToken);
        db.RolPermisos.AddRange(permisos.Values.Select(p=>new RolPermiso { RolId=admin.Id, PermisoId=p.Id }));
        foreach (var key in new[]{"eventos.consultar","eventos.crear","eventos.editar","clientes.consultar","clientes.gestionar"})
            db.RolPermisos.Add(new RolPermiso { RolId=receptionist.Id, PermisoId=permisos[key].Id });

        var user = new Usuario { PropietarioId=owner.Id, RolId=admin.Id, NombreCompleto="Administrador ALAFE", Correo="admin@alafe.local", TelefonoPaisCodigo="MX", Telefono="8670000000", EsPropietario=true, TokenVersion=1, Activo=true, TemaVisual="claro", VistaAgendaDefault="mes", FechaCreacion=DateTime.UtcNow };
        user.PasswordHash = hasher.HashPassword(user,"Admin123!");
        db.Usuarios.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        db.Agendas.Add(new Agenda { PropietarioId=owner.Id, Nombre="Alberca Las Palmas", MonedaCodigo="MXN", ZonaHoraria="America/Matamoros", NombreEventoDefault="Evento", MostrarNotaGeneral=true, NotaGeneral="Bienvenidos a Alberca Las Palmas.", NotaGeneralActualizadaEn=DateTime.UtcNow, NotaGeneralUsuarioId=user.Id, HoraAperturaDefault=new TimeSpan(9,0,0), HoraCierreDefault=new TimeSpan(22,0,0), Activo=true, FechaCreacion=DateTime.UtcNow });
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);
        logger.LogInformation("Espacio demo ALAFE creado con roles, permisos, usuario titular y agenda.");
    }

    private async Task EnsureCatalogsAsync(CancellationToken ct)
    {
        if (!await db.Monedas.AnyAsync(ct)) db.Monedas.AddRange(new Moneda { Codigo="MXN",Nombre="Peso mexicano",Simbolo="$",HabilitadaEnAgenda=true,HabilitadaEnMovimiento=true,Activo=true },new Moneda { Codigo="USD",Nombre="Dólar estadounidense",Simbolo="$",HabilitadaEnAgenda=true,HabilitadaEnMovimiento=true,Activo=true },new Moneda { Codigo="EUR",Nombre="Euro",Simbolo="€",HabilitadaEnAgenda=false,HabilitadaEnMovimiento=true,Activo=true });
        await db.SaveChangesAsync(ct);
        if (!await db.Paises.AnyAsync(ct)) db.Paises.AddRange(new Pais { Codigo="MX",Nombre="México",CodigoLada="+52",MonedaDefaultCodigo="MXN",Activo=true },new Pais { Codigo="US",Nombre="Estados Unidos",CodigoLada="+1",MonedaDefaultCodigo="USD",Activo=true });
        await db.SaveChangesAsync(ct);
        if (!await db.Planes.AnyAsync(ct)) db.Planes.AddRange(new Plan { Codigo="BASICO",Nombre="Básico",Descripcion="Plan básico",PrecioMensual=299,MonedaCodigo="MXN",LimiteAgendas=1,LimiteUsuarios=3,OrdenVisual=1,Activo=true },new Plan { Codigo="PROFESIONAL",Nombre="Profesional",Descripcion="Plan profesional",PrecioMensual=599,MonedaCodigo="MXN",LimiteAgendas=3,LimiteUsuarios=15,IncluyeMovimientos=true,OrdenVisual=2,Activo=true },new Plan { Codigo="EMPRESARIAL",Nombre="Empresarial",Descripcion="Plan empresarial",PrecioMensual=999,MonedaCodigo="MXN",IncluyeMovimientos=true,IncluyeReportes=true,IncluyeInventario=true,OrdenVisual=3,Activo=true });
        await db.SaveChangesAsync(ct);
        if (!await db.Permisos.AnyAsync(ct)) db.Permisos.AddRange(PermissionRows.Select(x=>new Permiso { Clave=x.Code,Modulo=x.Name,Descripcion=x.Description }));
        await db.SaveChangesAsync(ct);
    }
}
