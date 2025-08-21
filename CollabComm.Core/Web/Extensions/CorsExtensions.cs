using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CollabComm.Core.Web.Extensions;

public static class CorsExtensions
{
    public const string CorsName = "CustomCors";

    public static IServiceCollection AddCustomCors(this IServiceCollection services, IConfiguration configuration)
    {
        var corsOrigins = configuration.GetSection("CorsOrigins").Get<List<string>>();

        services.AddCors(options =>
        {
            options.AddPolicy(CorsName, policy =>
            {
                policy.SetIsOriginAllowedToAllowWildcardSubdomains();
                foreach (string item in corsOrigins)
                {
                    policy.WithOrigins(item).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
                }

                policy.Build();
            });
        });

        return services;
    }

    public static IApplicationBuilder UseCustomCors(this IApplicationBuilder app)
    {
        app.UseCors(CorsName);
        return app;
    }
}