using CollabComm.InterComm.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CollabComm.InterComm;

public static class InterCommServiceExtensions
{
    public static IServiceCollection AddInterCommServices(this IServiceCollection services,
        IConfiguration configuration)
    {
        // services.AddSingleton(serviceFactory => serviceFactory.GetRequiredService<IOptions<SiteConfig>>().Value);
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<DatabaseContext>(options => { options.UseNpgsql(connectionString); });

        services.AddScoped<IBaseRepository, BaseRepository>();
        services.AddScoped<ISqlRepository, SqlRepository>();


        services.AddAutoMapper(mc =>
        {
            mc.AddProfile(new InterCommMapperProfile());
        });

        return services;
    }
}