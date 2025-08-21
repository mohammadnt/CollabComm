using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CollabComm.Core.Web.Extensions;

public static class CustomExtensions
{
    public static void AddDefaultCacheValue(this IHeaderDictionary headers, int hours = 12)
    {
        headers.Append("Cache-Control",
            string.Format("public,max-age={0}", TimeSpan.FromHours(hours).TotalSeconds));
    }

    public static NotFoundResult AddCacheValue(this NotFoundResult obj, HttpContext context, int hours)
    {
        context.Response.Headers.Append("Cache-Control",
            string.Format("public,max-age={0}", TimeSpan.FromHours(hours).TotalSeconds));
        return obj;
    }

    public static void AddClearCache(this IHeaderDictionary headers)
    {
        headers.Append("Clear-Site-Data","\"cache\", \"executionContexts\"");
    }
}