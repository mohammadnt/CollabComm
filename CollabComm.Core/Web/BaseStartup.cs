using System.Reflection;
using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CollabComm.Core.Config;

namespace CollabComm.Core.Web;

public abstract class BaseStartup
{
    public IConfiguration Configuration { get; private set; }


    public BaseStartup(IConfiguration configuration)
    {
        // Environment = env;
        // var configBuilder = new ConfigurationBuilder();
        // configBuilder.AddJsonConfig(env);
        Configuration = configuration;
    }

    public virtual void ConfigureServices(IServiceCollection services)
    {
        services.AddMvcCore()
            .AddDataAnnotations()
            .AddApiExplorer()
            .AddFormatterMappings()
            .AddCors();

        //services.AddAuthorization();

        RegisterRepositories(services);
        RegisterServices(services);

        PushNotificationsOptions pno = new PushNotificationsOptions();
        Configuration.GetSection("PushNotifications").Bind(pno);
        services.AddSingleton(pno);  
        
        AuthConfig authConfig = new AuthConfig();
        Configuration.GetSection("Authentication").Bind(authConfig);
        services.AddSingleton(authConfig);
        
        SiteConfig siteConfig = new SiteConfig();
        Configuration.GetSection("Site").Bind(siteConfig);
        services.AddSingleton(siteConfig);

        services.Configure<ClientRateLimitOptions>(Configuration.GetSection("ClientRateLimiting"));
        services.AddInMemoryRateLimiting();
        
        services.AddScoped<IApplicationContext, ApplicationContext>();


        services.AddMemoryCache();
        services.AddHttpContextAccessor();

        services.AddResponseCompression(options => { options.EnableForHttps = true; });

    }

    public virtual void Configure(IApplicationBuilder app)
    {
    }

    private void RegisterRepositories(IServiceCollection services)
    {
        var assem = Assembly.GetEntryAssembly();

        var repositories = assem.GetTypes().Where(t =>
            !string.IsNullOrEmpty(t.Namespace) && !t.IsInterface && !t.IsAbstract && t.IsClass &&
            t.Namespace.EndsWith(".Repositories") && t.Name.EndsWith("Repository")).ToList();
        foreach (var repository in repositories)
        {
            var irepository = assem.GetTypes().Where(i =>
                    i.Namespace == repository.Namespace && i.IsInterface && i.Name == "I" + repository.Name)
                .SingleOrDefault();
            if (irepository != null)
                services.AddScoped(irepository, repository);
        }
    }

    private void RegisterServices(IServiceCollection services)
    {
        var assem = Assembly.GetEntryAssembly();

        var sers = assem.GetTypes().Where(t =>
            !string.IsNullOrEmpty(t.Namespace) && !t.IsInterface && !t.IsAbstract && t.IsClass &&
            t.Namespace.EndsWith(".Services") && t.Name.EndsWith("Service")).ToList();
        foreach (var service in sers)
        {
            var iservice = assem.GetTypes()
                .Where(i => i.Namespace == service.Namespace && i.IsInterface && i.Name == "I" + service.Name)
                .SingleOrDefault();
            if (iservice == null)
                throw new Exception("Service " + service.Name +
                                    " does not implement any interface derived from IBaseService");

            services.AddScoped(iservice, service);
        }
    }
}