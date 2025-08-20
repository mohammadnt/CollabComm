using CollabComm.Core;
using CollabComm.Core.Web.Controllers;
using CollabComm.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabComm.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class WebSocketController : BaseController
{
    private readonly IWebsocketHandler _websocketHandler;


    public WebSocketController(
        IApplicationContext app,
        IWebsocketHandler websocketHandler) : base(app)
    {
        _websocketHandler = websocketHandler;
    }
    
    [HttpGet]
    public async Task Get(CancellationToken cancellationToken = default)
    {
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