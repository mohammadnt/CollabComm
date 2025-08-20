using System.IO.Compression;
using AspNetCoreRateLimit;
using CollabComm.Core.Models;
using Lib.Net.Http.WebPush;
using Microsoft.AspNetCore.Http.Features;
using CollabComm.Core.Web;
using CollabComm.Core.Web.Extensions;
using CollabComm.Core.Web.Middlewares;
using CollabComm.InterComm;
using CollabComm.InterComm.Repositories;
using CollabComm.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;

namespace CollabComm;

public class Startup : BaseStartup
{
    public Startup(IConfiguration configuration) : base(configuration)
    {
        BsonSerializer.RegisterSerializer(new GuidSerializer(GuidRepresentation.Standard));
    }

    public override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);

        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();
        

        services.AddCustomCors(Configuration);

        services.Configure<CollabCommMongoSettings>(Configuration.GetSection("CollabCommMongoSettings"));

        services.AddInterCommServices(Configuration);

        services.AddIdentityService<DatabaseContext>();

        services.AddScoped<PushServiceClient>();

        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<IMongoService, MongoService>();
        services.AddSingleton<IProcessMessage, ProcessMessage>();
        services.AddScoped<IPushService, PushService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IMainService, MainService>();
        services.AddSingleton<IWebsocketHandler, WebsocketHandler>();
        
        services.AddSingleton<IClientPolicyStore, MemoryCacheClientPolicyStore>();
        services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
        services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
        services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
        services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
        services.Configure<FormOptions>(x =>
        {
            x.ValueLengthLimit = 4194304;
            x.MultipartBodyLengthLimit = 524288000; // In case of multipart
        });


        services.Configure<MyStaticFileOptions>(o => { o.RequestPath = PathString.FromUriComponent("/PublicFiles"); });
        services.AddSingleton<StaticFileDetector>();

        services.AddSpaStaticFiles(configuration => { configuration.RootPath = "wwwroot"; });
        services.Configure<GzipCompressionProviderOptions>(options => { options.Level = CompressionLevel.Fastest; });
        services.AddResponseCompression();

        services.AddResponseCompression(options =>
        {
            options.Providers.Add<GzipCompressionProvider>();
            options.EnableForHttps = true;
        });

        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(CookieAuthenticationDefaults.AuthenticationScheme,
                options =>
                {
                    options.LoginPath = new PathString("/auth/login");
                    options.AccessDeniedPath = new PathString("/auth/denied");
                });
        services.AddAuthorization();
    }

    public void Configure(WebApplication app, IWebHostEnvironment env)
    {
// Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
        }
        else
        {
            app.UseCustomCors();
            // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
            app.UseHsts();
        }

        app.UseResponseCompression();
        app.UseMiddleware<MaintenanceMiddleware>();

        app.UseMiddleware<CustomClientRateLimitMiddleware>();


        // app.UseHttpsRedirection();

        app.Use(async (ctx, next) =>
        {
            var path = ctx.Request.Path;
            var detector = app.Services.GetService<StaticFileDetector>();
            var exists = detector.FileExists(path);
            if (exists == null || exists == true)
                await next();
            if (exists == false)
            {
                // do nothing
            }
        });

        // Use static files from Angular dist folder in production
        if (env.IsProduction())
        {
            app.UseSpaStaticFiles(new StaticFileOptions
            {
                OnPrepareResponse = context =>
                {
                    context.Context.Response.Headers.Add("Cache-Control", "max-age=31536000");
                    context.Context.Response.Headers.Add("Expires", "31536000");
                }
            });
        }

        app.UseStaticFiles(app.Services.GetService<IOptions<MyStaticFileOptions>>().Value);

        app.Use(async (context, next) =>
        {
            ApplyHeaders(app, context.Response.Headers);
            await next();
        });

        app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromSeconds(60) });

        app.UseAuthentication();
        app.UseRouting();
        app.UseMiddleware<AuthenticationMiddleware>();
        app.UseMiddleware<UnhandledExceptionMiddleware>();

        // app.UseIdentityServer();
        app.UseAuthorization();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllerRoute(
                name: "default",
                pattern: "api/{controller}/{action=Index}/{id?}");
        });

        app.MapFallbackToFile("index.html");

        var excludedPaths = new PathString[] { "/api" };
        app.UseWhen((ctx) =>
        {
            var path = ctx.Request.Path;
            return !Array.Exists(excludedPaths,
                excluded => path.StartsWithSegments(excluded, StringComparison.OrdinalIgnoreCase));
        }, then =>
        {
            then.UseSpa(spa =>
            {
                if (env.IsDevelopment())
                {
                    spa.UseProxyToSpaDevelopmentServer($"http://localhost:8443");
                }
            });
        });

        app.Run();
    }

    void ApplyHeaders(WebApplication app, IHeaderDictionary headers)
    {
        if (!app.Environment.IsDevelopment())
        {
            // headers.Add("Cross-Origin-Embedder-Policy", "require-corp");
            // headers.Add("Cross-Origin-Opener-Policy", "same-origin");
        }
    }
}