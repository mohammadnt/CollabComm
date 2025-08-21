using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Net.Http.Headers;

namespace CollabComm.Core.Web;

public class ApplicationContext<TUserKey> : IApplicationContext<TUserKey> where TUserKey : IEquatable<TUserKey>
{
    public TUserKey SessionId { get; set; }
    public TUserKey UserId { get; set; }
    public TUserKey Roles { get; set; }
    public IPAddress UserIP { get; protected set; }
    public ClaimsPrincipal User { get; }
    public string TraceId { get; protected set; }

    public string AccessToken { get; protected set; }

    protected readonly IServiceProvider ServiceProvider;
    protected readonly IHttpContextAccessor HttpContextAccessor;

    public ApplicationContext(IServiceProvider serviceProvider)
    {
        ServiceProvider = serviceProvider;
        HttpContextAccessor = serviceProvider.GetRequiredService<IHttpContextAccessor>();
        User = HttpContextAccessor?.HttpContext?.User;
        UserIP = HttpContextAccessor?.HttpContext?.Connection?.RemoteIpAddress;
        TraceId = HttpContextAccessor?.HttpContext?.TraceIdentifier;

        if (HttpContextAccessor?.HttpContext?.Request?.Headers != null && HttpContextAccessor.HttpContext.Request.Headers.ContainsKey(HeaderNames.Authorization))
            AccessToken = HttpContextAccessor.HttpContext.Request.Headers[HeaderNames.Authorization];
        else
            AccessToken = string.Empty;
    }

}
public class ApplicationContext : ApplicationContext<string>, IApplicationContext
{
    public ApplicationContext(IServiceProvider serviceProvider) : base(serviceProvider)
    {
        var userIdClaim = HttpContextAccessor?.HttpContext?.User?.Claims.Where(x => x.Type == ClaimTypes.NameIdentifier).SingleOrDefault();
        var cidClaim = HttpContextAccessor?.HttpContext?.User?.Claims.Where(x => x.Type == ClaimTypes.Sid).SingleOrDefault();
        var rolesClaim = HttpContextAccessor?.HttpContext?.User?.Claims.Where(x => x.Type == ClaimTypes.Role).SingleOrDefault();
            
        if (userIdClaim is null || cidClaim is null)
        {
            UserId = null;
            SessionId = null;
            Roles = null;
        }
        else
        {
            UserId = userIdClaim.Value;
            SessionId = cidClaim.Value;
            Roles = rolesClaim.Value;
        }
    }
}