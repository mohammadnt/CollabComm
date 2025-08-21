

using CollabComm.Core;
using CollabComm.Core.Config;
using CollabComm.Core.Web.Controllers;
using CollabComm.DTO;
using CollabComm.InterComm.Services;
using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace CollabComm.Controllers;


[ApiController]
[Authorize]
[Route("api/[controller]/[action]")]
public class PushSubscriptionsController : BaseController
{
    private readonly PushNotificationsOptions _pno;

    // private readonly IPushSubscriptionsService _pushSubscriptionsService;
    private readonly PushServiceClient _pushClient;
    private readonly IUserService _userService;

    public PushSubscriptionsController(IApplicationContext app,
        PushNotificationsOptions pno, IUserService userService,
        // IPushSubscriptionsService pushSubscriptionsService,
        PushServiceClient pushClient) : base(app)
    {
        _userService = userService;
        _pno = pno;
        _pushClient = pushClient;
        _pushClient.DefaultAuthentication = new VapidAuthentication(pno.PublicKey, pno.PrivateKey)
        {
            Subject = "https://localhost"
        };
    }

    [HttpPost]
    public async Task<ResultSet<object>> Add([FromBody] PushSubscription subscription,
        CancellationToken cancellationToken = default)
    {
        await _userService.UpdateSubscription(new Guid(App.SessionId), JsonConvert.SerializeObject(subscription),
            cancellationToken);
        return new ResultSet<object>(true);
    }

    [HttpPost]
    public async Task<ResultSet<object>> UpdateAndroidToken([FromBody] TitleRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        await _userService.UpdateSubscription(new Guid(App.SessionId), request.title,
            cancellationToken);
        return new ResultSet<object>(true);
    }


    [HttpPost]
    public async Task<ResultSet<object>> PublicKey(CancellationToken cancellationToken = default)
    {
        return new ResultSet<object>(_pno.PublicKey);
    }
}