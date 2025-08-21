 using CollabComm.Core;
using CollabComm.Core.Web.Controllers;
using CollabComm.InterComm.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabComm.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]/[action]")]
public class WebSocketLocalController : BaseController
{
    private readonly IWebHostEnvironment _hostingEnvironment;
    private readonly IWebsocketHandler _websocketHandler;


    public WebSocketLocalController(
        IApplicationContext app,
        IWebHostEnvironment hostingEnvironment,
        IWebsocketHandler websocketHandler) : base(app)
    {
        _hostingEnvironment = hostingEnvironment;
        _websocketHandler = websocketHandler;
    }

    [HttpGet]
    public async Task local(CancellationToken cancellationToken = default)
    {
        if (_hostingEnvironment.IsDevelopment() == false)
        {
            throw new Exception();
        }
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();

            await _websocketHandler.Handle(new Guid(App.UserId), webSocket);
        }
        else
        {
            HttpContext.Response.StatusCode = 400;
        }
    }
}