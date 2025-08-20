using AutoMapper;
using CollabComm.Core;
using CollabComm.Core.Config;
using CollabComm.Core.Helpers;
using CollabComm.Core.Models;
using CollabComm.Core.Web.Controllers;
using CollabComm.Core.Web.Extensions;
using CollabComm.DTO;
using CollabComm.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabComm.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]/[action]")]
public class UserController : BaseController
{
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;
    private readonly SiteConfig _siteConfig;
    private readonly IMainService _mainService;


    public UserController(IApplicationContext app,
        IHttpContextAccessor httpContextAccessor,
        IWebHostEnvironment hostingEnvironment,
        IUserService userService,
        IMapper mapper,
        IMainService mainService,
        SiteConfig siteConfig) : base(app)
    {
        _httpContextAccessor = httpContextAccessor;
        _mapper = mapper;
        _userService = userService;
        _siteConfig = siteConfig;
        _mainService = mainService;
    }

    [HttpPost]
    public async Task<ResultSet<object>> MyData([FromBody] UserDataRequestDTO? request,
        CancellationToken cancellationToken = default)
    {
        ResultSet<object> logout()
        {
            _httpContextAccessor.HttpContext.Response.DeleteCookie("token");
            _httpContextAccessor.HttpContext.Response.DeleteCookie("isAdmin");
            return new ResultSet<object>() { code = ResponseCodes.Logout };
        }


        var session = await _userService.GetSession(App.SessionIdGuid, new Guid(App.UserId),
            cancellationToken);

        if (session == null)
        {
            return logout();
        }

        bool is_cache_cleared = false;
        if (session.cache_cleared < _siteConfig.CacheCleared)
        {
            HttpContext.Response.Headers.AddClearCache();
            is_cache_cleared = true;
            await _mainService.UpdateSession(App.SessionIdGuid, _siteConfig.CacheCleared,
                cancellationToken);
        }

        if (session != null && session.client_type == (int)ClientTypes.Android)
        {
            if (request == null || request.build_number == null || request.build_number.Value < 44)
            {
                // activate force update
            }
        }

        await _userService.UpdateSession(App.UserIdGuid, DateTime.UtcNow, request.app_version,
            request.store_id, request.user_agent, request.build_number, _siteConfig.CacheCleared,
            cancellationToken);

        var user = await _userService.GetUser(App.UserIdGuid, cancellationToken);
        return new ResultSet<object>(new { is_cache_cleared, user });
    }
    

    [HttpPost]
    public async Task<ResultSet<object>> SetProfilePhoto([FromBody] IdNullRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var res = await _userService.UpdateProfilePhoto(new Guid(App.UserId), request.id, cancellationToken);
        return new ResultSet<object>(res);
    }
}