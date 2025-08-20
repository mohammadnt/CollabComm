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
        var connectionString = configuration.GetConnectionString("Postgres");
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