using System.Net.WebSockets;
using System.Text;
using CollabComm.Core.Models;
using Newtonsoft.Json;

namespace CollabComm.Services;

public class SocketConnection
{
    public Guid ConnectionId { get; set; }
    public Guid UserId { get; set; }
    public WebSocket webSocket { get; set; }
}

public interface IWebsocketHandler
{
    Task Handle(Guid userId, WebSocket webSocket);
    Task SendMessageToSockets(Guid userId, WebsocketModel message);
    Task SendMessageToGroup(Guid groupId, WebsocketModel message);
    Task SendMessageToSockets(Guid userId, string message);
}

public class WebsocketHandler : IWebsocketHandler
{
    private readonly IProcessMessage _processMessage;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IServiceProvider _serviceProvider;

    public WebsocketHandler(IProcessMessage processMessage, IServiceScopeFactory scopeFactory,
        IServiceProvider serviceProvider)
    {
        _processMessage = processMessage;
        _scopeFactory = scopeFactory;
        _serviceProvider = serviceProvider;
    }

    public List<SocketConnection> websocketConnections = new List<SocketConnection>();

    public async Task Handle(Guid userId, WebSocket webSocket)
    {
        var cid = Guid.NewGuid();
        lock (websocketConnections)
        {
            websocketConnections.Add(new SocketConnection
            {
                UserId = userId,
                webSocket = webSocket,
                ConnectionId = cid
            });
        }

        await ReceiveMessage(userId, webSocket, cid);
    }

    private async Task ReceiveMessage(Guid userId, WebSocket webSocket, Guid cid)
    {
        WebSocketReceiveResult result = null;
        string signal = null;
        try
        {
            var buffer = new byte[1024 * 12];
            result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            while (!result.CloseStatus.HasValue)
            {
                if (webSocket.State == WebSocketState.Aborted)
                {
                    break;
                }


                if (webSocket.State == WebSocketState.Closed)
                {
                    break;
                }

                signal = Encoding.UTF8.GetString(buffer);
                var msg = JsonConvert.DeserializeObject<WebsocketModel>(signal);
                await handleMessage(userId, msg);
                buffer = new byte[1024 * 12];
                result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            }

            if (result != null && result.CloseStatus.HasValue && webSocket.State != WebSocketState.Aborted)
                await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription,
                    CancellationToken.None);
        }
        catch (Exception ex)
        {
            if (ex is WebSocketException || ex is OperationCanceledException)
            {
            }
            else
            {
               
            }

            Console.WriteLine(ex);
        }

        websocketConnections.RemoveAll(s => s.ConnectionId == cid);
    }

    public async Task SendMessageToSockets(Guid userId, WebsocketModel message)
    {
        await SendMessageToSockets(userId, JsonConvert.SerializeObject(message));
    }

    public async Task SendMessageToSockets(Guid userId, string message)
    {
        var connections = websocketConnections.Where(s => s.UserId == userId);
        var tasks = connections.Select(async websocketConnection =>
        {
            var bytes = Encoding.Default.GetBytes(message);
            var arraySegment = new ArraySegment<byte>(bytes);
            try
            {
                await websocketConnection.webSocket.SendAsync(arraySegment, WebSocketMessageType.Text, true,
                    CancellationToken.None);
            }
            catch (Exception ex)
            {
            }
        });
        await Task.WhenAll(tasks);
    }

    public async Task SendMessageToGroup(Guid groupId, WebsocketModel message)
    {
        using (var scope = _scopeFactory.CreateScope())
        {
            IChatService _chatService = scope.ServiceProvider.GetRequiredService<IChatService>();

            var allUsers = await _chatService.GetUserGroups(groupId, CancellationToken.None);
            var tasks = allUsers.Select(async s => { await this.SendMessageToSockets(s.user_id, message); });

            await Task.WhenAll(tasks);
        }
    }

    private async Task handleMessage(Guid userId, WebsocketModel msg)
    {
        try
        {
            switch (msg.method)
            {
                case MethodCode.send_message:
                    var data = JsonConvert.DeserializeObject<SendMessageWebsocketModel>(msg.data);
                    await _processMessage.Process(userId, msg.identifier, data, CancellationToken.None);

                    break;
                case MethodCode.send_message_resposne:

                    break;
            }
        }
        catch (Exception ex)
        {
            // Log error
        }
    }
}