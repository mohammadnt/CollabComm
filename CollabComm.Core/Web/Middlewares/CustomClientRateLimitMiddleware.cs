using System.Text.Json;
using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CollabComm.Core.Web.Middlewares;

public class CustomClientRateLimitMiddleware : ClientRateLimitMiddleware
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IServiceProvider _serviceProvider;

    public CustomClientRateLimitMiddleware(RequestDelegate next,
        IProcessingStrategy processingStrategy,
        IOptions<ClientRateLimitOptions> options, IClientPolicyStore policyStore,
        IRateLimitConfiguration config, ILogger<ClientRateLimitMiddleware> logger,
        IServiceScopeFactory scopeFactory, IServiceProvider serviceProvider) :
        base(next, processingStrategy, options, policyStore, config, logger)

    {
        _scopeFactory = scopeFactory;
        _serviceProvider = serviceProvider;
    }

    public override async Task ReturnQuotaExceededResponse
        (HttpContext httpContext, RateLimitRule rule, string retryAfter)
    {
        string? requestPath = httpContext?.Request?.Path.Value;
        var result = JsonSerializer.Serialize("API calls quota exceeded!");
        httpContext.Response.Headers["Retry-After"] = retryAfter;
        httpContext.Response.StatusCode = 429;
        httpContext.Response.ContentType = "application/json";

        // await WriteQuotaExceededResponseMetadata(requestPath, retryAfter);
        await httpContext.Response.WriteAsync(result);
    }

    private async Task WriteQuotaExceededResponseMetadata
        (string requestPath, string retryAfter, int statusCode = 429)
    {
        try
        {
            using (var scope = _scopeFactory.CreateScope())
            {
            }
        }
        catch
        {
            throw;
        }
    }
}