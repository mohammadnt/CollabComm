using CollabComm.Core;
using CollabComm.Core.Config;
using CollabComm.Core.Helpers;
using CollabComm.Core.Web.Controllers;
using CollabComm.DTO;
using CollabComm.Services;
using Microsoft.AspNetCore.Mvc;


namespace CollabComm.Controllers;

[ApiController]
[Route("api/[controller]/[action]")]
public class AuthController : BaseController
{
    private readonly IUserService _userService;

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IWebHostEnvironment _hostingEnvironment;
    private readonly SiteConfig _siteConfig;

    public AuthController(IApplicationContext app, IUserService userService,
        IHttpContextAccessor httpContextAccessor,
        IWebHostEnvironment hostingEnvironment,
        SiteConfig siteConfig) : base(app)
    {
        _userService = userService;
        _httpContextAccessor = httpContextAccessor;
        _hostingEnvironment = hostingEnvironment;
        _siteConfig = siteConfig;
    }

    [HttpPost]
    public async Task<ResultSet<object>> Login([FromBody] LoginRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var username = request.username?.Trim()?.ToLower();
        var pw = request.password?.Trim();

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(pw))
            return new ResultSet<object>() { code = ResponseCodes.WrongArgument };

        var user = await _userService.GetUser(username, cancellationToken);
        if (user == null || user.password != pw)
            return new ResultSet<object>() { code = ResponseCodes.WrongArgument };
        var connection = await _userService.CreateSession(user.id, request.user_agent, request.client_type,
            request.device_id, request.app_version, request.store_id, _siteConfig.CacheCleared,
            cancellationToken);

        var token = await _userService.GetToken(user, connection.id.ToString(), cancellationToken);
        
        _httpContextAccessor.HttpContext.Response.AddCookie(_hostingEnvironment.IsDevelopment(), "token", token);
        var roles = await _userService.GetRoles(user.id, cancellationToken);
        if (roles.Any(s => s.title.ToLower().Contains("superadmin")))
            _httpContextAccessor.HttpContext.Response.AddCookie(_hostingEnvironment.IsDevelopment(), "isAdmin",
                "1");

        return new ResultSet<object>(new { user = user, token = token });
    }

    [HttpPost]
    public async Task<ResultSet<object>> Register([FromBody] RegisterRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var username = request.username?.Trim()?.ToLower();
        var pw = request.password?.Trim();

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(pw))
            return new ResultSet<object>() { code = ResponseCodes.WrongArgument };

        var user = await _userService.GetUser(username, default);
        if (user != null)
            return new ResultSet<object> { code = ResponseCodes.WrongArgument };

        user = await _userService.CreateUser(username, pw, request.first_name.Trim(), request.last_name.Trim());

        var connection = await _userService.CreateSession(user.id, request.user_agent, request.client_type,
            request.device_id, request.app_version, request.store_id, _siteConfig.CacheCleared,
            default);

        var token = await _userService.GetToken(user, connection.id.ToString(), default);


        _httpContextAccessor.HttpContext.Response.AddCookie(_hostingEnvironment.IsDevelopment(), "token", token);
        var roles = await _userService.GetRoles(user.id, cancellationToken);
        if (roles.Any(s => s.title.ToLower().Contains("superadmin")))
            _httpContextAccessor.HttpContext.Response.AddCookie(_hostingEnvironment.IsDevelopment(), "isAdmin",
                "1");

        return new ResultSet<object>(new { user = user, token = token });
    }

    [HttpPost]
    public async Task<ResultSet<object>> Logout(CancellationToken cancellationToken = default)
    {
        await _userService.UpdateSessionDeleted(new Guid(App.SessionId), true,
            cancellationToken);
        _httpContextAccessor.HttpContext.Response.DeleteCookie("token");
        return new ResultSet<object>(true);
    }
}