using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Alafe.Api.Data;

namespace Alafe.Api.Security;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
public sealed class RequirePermissionAttribute(string permission) : AuthorizeAttribute($"Permission:{permission}");

public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;

public sealed class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    private const string Prefix = "Permission:";
    private readonly DefaultAuthorizationPolicyProvider _fallback;
    public PermissionPolicyProvider(Microsoft.Extensions.Options.IOptions<AuthorizationOptions> options) => _fallback = new(options);
    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => _fallback.GetDefaultPolicyAsync();
    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => _fallback.GetFallbackPolicyAsync();
    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (!policyName.StartsWith(Prefix, StringComparison.Ordinal)) return _fallback.GetPolicyAsync(policyName);
        var permission = policyName[Prefix.Length..];
        var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().AddRequirements(new PermissionRequirement(permission)).Build();
        return Task.FromResult<AuthorizationPolicy?>(policy);
    }
}

public sealed class PermissionAuthorizationHandler(AlafeDbContext db, ICurrentUserService currentUser)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (!currentUser.IsAuthenticated || currentUser.UsuarioId is null || currentUser.PropietarioId is null || currentUser.RolId is null) return;
        var granted = await db.Roles.AsNoTracking()
            .Where(r => r.Id == currentUser.RolId && r.PropietarioId == currentUser.PropietarioId && r.Activo)
            .SelectMany(r => r.RolPermisos)
            .AnyAsync(rp => rp.Permiso != null && rp.Permiso.Clave == requirement.Permission);
        if (granted) context.Succeed(requirement);
    }
}
