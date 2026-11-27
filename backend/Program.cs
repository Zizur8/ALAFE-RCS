using Alafe.Api.Data;
using Alafe.Api.Data.Seed;
using Alafe.Api.Middlewares;
using Alafe.Api.Models;
using Alafe.Api.Security;
using Alafe.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// CORS: origen permitido leído de configuración (+ http://localhost:5173 en dev)
// ---------------------------------------------------------------------------
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
var allowedOrigins = configuredOrigins
    .Append("http://localhost:5173")
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AlafeCors", policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// ---------------------------------------------------------------------------
// Entity Framework Core + SQL Server
// ---------------------------------------------------------------------------
builder.Services.AddDbContext<AlafeDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();
builder.Services.AddScoped<DatabaseSeeder>();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAgendaAccessService, AgendaAccessService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRolService, RolService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IConfiguracionService, ConfiguracionService>();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

// ---------------------------------------------------------------------------
// Autenticación JWT (clave / issuer / audience desde configuración "Jwt")
// ---------------------------------------------------------------------------
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]
    ?? throw new InvalidOperationException("Falta la configuración 'Jwt:Key'.");
var jwtIssuer = jwtSection["Issuer"] ?? throw new InvalidOperationException("Falta la configuración 'Jwt:Issuer'.");
var jwtAudience = jwtSection["Audience"] ?? throw new InvalidOperationException("Falta la configuración 'Jwt:Audience'.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var principal = context.Principal;
                var subject = principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var versionClaim = principal?.FindFirst("tokenVersion")?.Value;
                if (!int.TryParse(subject, out var userId) || !int.TryParse(versionClaim, out var tokenVersion))
                {
                    context.Fail("Sesión inválida o revocada.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<AlafeDbContext>();
                var valid = await db.Usuarios.AsNoTracking().AnyAsync(u => u.Id == userId && u.Activo && u.TokenVersion == tokenVersion &&
                    u.Propietario != null && u.Propietario.Activo);
                if (!valid) context.Fail("Sesión inválida o revocada.");
            }
        };
    });

builder.Services.AddAuthorization();

// ---------------------------------------------------------------------------
// MVC / OpenAPI
// ---------------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    await using var scope = app.Services.CreateAsyncScope();
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync(development: true);
}

// Middleware global de errores (JSON uniforme) — siempre primero.
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AlafeCors");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
