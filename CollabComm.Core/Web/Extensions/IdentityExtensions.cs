using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CollabComm.Core.Web.Extensions;

public static class IdentityExtensions
{
    public static IServiceCollection AddIdentityService<TContext>(this IServiceCollection services) where TContext : DbContext
    {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme);

        services.ConfigureApplicationCookie(options =>
        {
            options.Cookie.Name = "auth";
        });
        return services;
    }
    public static IApplicationBuilder UseIdentity(this IApplicationBuilder app)
    {
        app.UseAuthentication();

        app.UseAuthorization();

        return app;
    }
}