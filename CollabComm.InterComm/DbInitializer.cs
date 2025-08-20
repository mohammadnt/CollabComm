using CollabComm.InterComm.Repositories;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CollabComm.InterComm;

public static class DbInitializer
{
    public static void Initialize(WebApplication app)
    {
        using (var serviceScope = app.Services.GetRequiredService<IServiceScopeFactory>().CreateScope())
        {
            using (var context = serviceScope.ServiceProvider.GetService<DatabaseContext>())
            {
                var pendingMigrations = context.Database.GetPendingMigrations();
                var migrations = pendingMigrations as IList<string> ?? pendingMigrations.ToList();
                if (!migrations.Any())
                {
                    Console.WriteLine("No pending migratons");
                }
                else
                {
                    Console.WriteLine("Pending migratons {0}", migrations.Count());
                    foreach (var migration in migrations)
                    {
                        Console.WriteLine($"\t{migration}");
                    }

                    context.Database.Migrate();
                }
            }
        }
    }
}