using AutoMapper;
using CollabComm.Core;
using CollabComm.Core.Config;
using CollabComm.Core.Web.Controllers;
using CollabComm.Services;
using Microsoft.AspNetCore.Mvc;

namespace CollabComm.Controllers;

[ApiController]
[Route("api/[controller]/[action]")]
public class PublicController : BaseController
{
    private readonly IUserService _userService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;
    private readonly SiteConfig _siteConfig;
    private readonly IMainService _mainService;


    public PublicController(IApplicationContext app,
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
    
}