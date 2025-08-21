using System.Net;
using CollabComm.Core.Config;
using CollabComm.Core.Web.Controllers;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;

namespace CollabComm.Core.Web.Middlewares;

public class MaintenanceMiddleware
{
    private readonly RequestDelegate _next;
    private readonly SiteConfig _siteConfig;

    public MaintenanceMiddleware(RequestDelegate next, SiteConfig siteConfig)
    {
        _next = next;
        _siteConfig = siteConfig;
    }

    public async Task Invoke(HttpContext httpContext)
    {
        if (IsMaintenanceModeEnabled() && (httpContext.Request.Path.StartsWithSegments("/api") ))
        {
            // if (httpContext.Request.Method == "POST")
            //     httpContext.Response.Redirect("/Error/MaintenancePost");
            // else
            //     httpContext.Response.Redirect("/Error/Maintenance");

            var result = JsonConvert.SerializeObject(new
                { code = ResponseCodes.UnderMaintenance, data = "Site is under maintenance" });
            httpContext.Response.StatusCode = (int)HttpStatusCode.OK;
            httpContext.Response.ContentType = "application/json";
            
            await httpContext.Response.WriteAsync(result);
        }
        else
        {

            await _next.Invoke(httpContext);
        }
    }

    private bool IsMaintenanceModeEnabled()
    {
        return _siteConfig.IsMaintenanceMode;
    }
}