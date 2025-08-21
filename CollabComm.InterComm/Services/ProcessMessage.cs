using CollabComm.Core.Models;
using CollabComm.InterComm.Models;
using CollabComm.InterComm.MongoModels;
using CollabComm.InterComm.Repositories;
using CollabComm.Models;
using Lib.Net.Http.WebPush;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;

namespace CollabComm.InterComm.Services;

public interface IProcessMessage
{
    Task Process(Guid senderId, string identifier, SendMessageWebsocketModel data, CancellationToken cancellationToken);
}

public class ProcessMessage : IProcessMessage
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IServiceProvider _serviceProvider;


    public ProcessMessage(IServiceScopeFactory  scopeFactory, IServiceProvider serviceProvider)
    {
        _scopeFactory = scopeFactory;
        _serviceProvider = serviceProvider;
    }

    public async Task Process(Guid senderId, string identifier, SendMessageWebsocketModel data,
        CancellationToken cancellationToken)
    {
        using (var scope = _scopeFactory.CreateScope())
        {
            var websocketHandler = _serviceProvider.GetRequiredService<IWebsocketHandler>();

            IChatService _chatService = scope.ServiceProvider.GetRequiredService<IChatService>();
            IPushService _pushService = scope.ServiceProvider.GetRequiredService<IPushService>();
            ISqlRepository sqlRepository =
                scope.ServiceProvider.GetRequiredService<ISqlRepository>();
            IMongoServices _mongoServices = scope.ServiceProvider.GetRequiredService<IMongoServices>();
            IUserService _userService = scope.ServiceProvider.GetRequiredService<IUserService>();
            var userId = data.to_id;
            var user = await _userService.GetUserInfo(userId, cancellationToken);
            var senderUser = await _userService.GetUserInfo(senderId, cancellationToken);

            ChatMessageInfo forwardedMessage = null;
            Guid? forwardUserId = null;
            if (data.forward_message_id != null)
            {
                Guid fromId, toId;
                forwardedMessage = await _mongoServices.GetMessageById(data.forward_message_id, cancellationToken);
                if (forwardedMessage.is_group)
                {
                    var members = await _chatService.GetUserGroups(forwardedMessage.from_id, cancellationToken);
                    if (!members.Any(s => s.user_id == senderId))
                        return;

                    forwardUserId = forwardedMessage.to_id;
                    fromId = toId = forwardedMessage.to_id;
                }
                else
                {
                    if (forwardedMessage.from_id != senderId && forwardedMessage.to_id != senderId)
                        return;

                    if (forwardedMessage.is_sender)
                        forwardUserId = forwardedMessage.from_id;
                    else
                        forwardUserId = forwardedMessage.to_id;
                    
                    fromId = senderId;
                    toId = userId;
                }

                if (forwardedMessage.forward_user_id != null)
                {
                    forwardUserId = forwardedMessage.forward_user_id;
                }

                data.text = forwardedMessage.text;
                data.type = (MessageType)forwardedMessage.type;
                data.data = forwardedMessage.data;
                if (forwardedMessage.media_id != null)
                {
                    var media = await _mongoServices.CloneChatMedia(forwardedMessage.media_id, fromId, toId);
                    data.file_id = media.id;
                }

            }

            if (user.type == UserType.User.GetHashCode())
            {
                ConversationInfo conv2 = await _chatService.GetConversation(senderId, userId, cancellationToken);
                ConversationInfo conv1 = null;
                if (senderId != userId)
                    conv1 = await _chatService.GetConversation(userId, senderId, cancellationToken);

                if (conv2 != null && conv2.deleted)
                    return;
                if (conv1 != null && conv1.deleted)
                    return;
                
                string targetReplyid = null;
                if (data.reply_id != null)
                {
                    var repliedMessage = await _mongoServices.GetMessageById(data.reply_id, cancellationToken);
                    if (repliedMessage.pair_id == null && repliedMessage.from_id != repliedMessage.to_id)
                    {
                        var fromId = user.type == (int)UserType.Group ? user.id : user.id;
                        var pairReplyMsg = await _mongoServices.GetMessageByPairId(user.type == (int)UserType.Group,
                            userId, data.reply_id, cancellationToken);
                        targetReplyid = pairReplyMsg.id;
                    }
                    else
                    {
                        targetReplyid = repliedMessage.pair_id;
                    }
                }

                bool isConv2Created = conv2 == null;
                if (conv2 == null)
                {
                    conv2 = await _chatService.CreateConversation(
                        Conversation.Generate(senderId, userId),
                        cancellationToken);
                }


                string mediaPath = null;
                var message2 = ChatMessage.Generate(senderId, userId, data.text, true, data.type, data.data, data.file_id,
                    mediaPath, senderUser.last_message_counter + 1, false,
                    conv2.last_message_counter + 1, data.reply_id, forwardedMessage?.id, forwardUserId);


                await _mongoServices.CreateMessage(message2);

                await sqlRepository.UpdateByFilter<CollabUser>(s => s.id == senderId,
                    s => new { last_message_counter = s.last_message_counter + 1 }, cancellationToken);


                await sqlRepository.UpdateByFilter<Conversation>(
                    s => s.from_id == senderId && s.to_id == userId,
                    s => new
                    {
                        last_message_counter = s.last_message_counter + 1,
                        last_seen_counter = s.last_message_counter + 1, last_message_id = message2.id,
                        last_message_date = message2.creation_date
                    },
                    cancellationToken);
                if (isConv2Created)
                    await sqlRepository.UpdateByFilter<Conversation>(
                        s => s.from_id == senderId && s.to_id == userId,
                        s => new { first_message_id = message2.id }, cancellationToken);


                var signal2 = new WebsocketModel(MethodCode.send_message_resposne, message2, identifier);

                await websocketHandler.SendMessageToSockets(senderId, signal2);
                if (senderId != userId)
                {
                    bool isConv1Created = conv1 == null;
                    if (conv1 == null)
                    {
                        conv1 = await _chatService.CreateConversation(
                            Conversation.Generate(userId, senderId),
                            cancellationToken);
                    }

                    var message1 = ChatMessage.Generate(userId, senderId, data.text, false, data.type, data.data,
                        data.file_id,
                        mediaPath, user.last_message_counter + 1, false,
                        conv1.last_message_counter + 1, targetReplyid, forwardedMessage?.id, forwardUserId);
                    message1.pair_id = message2.id;
                    await _mongoServices.CreateMessage(message1);
                    await sqlRepository.UpdateByFilter<CollabUser>(s => s.id == userId,
                        s => new { last_message_counter = s.last_message_counter + 1 }, cancellationToken);
                    await sqlRepository.UpdateByFilter<Conversation>(
                        s => s.from_id == userId && s.to_id == senderId,
                        s => new
                        {
                            last_message_counter = s.last_message_counter + 1, last_message_id = message1.id,
                            last_message_date = message1.creation_date
                        },
                        cancellationToken);
                    if (isConv1Created)
                        await sqlRepository.UpdateByFilter<Conversation>(
                            s => s.from_id == userId && s.to_id == senderId,
                            s => new { first_message_id = message1.id }, cancellationToken);
                    var signal1 = new WebsocketModel(MethodCode.send_message, message1);
                    await websocketHandler.SendMessageToSockets(userId, signal1);
                    string body = getMessageSummary(message1);
                    Task.Run(async () =>
                    {
                        using (var scope = _scopeFactory.CreateScope())
                        {
                            IUserService _userService = scope.ServiceProvider.GetRequiredService<IUserService>();
                            PushServiceClient pushClient =
                                scope.ServiceProvider.GetRequiredService<PushServiceClient>();
                            await _pushService.SendNotifications(_userService, pushClient, userId,
                                senderId,
                                senderUser.first_name + " " + senderUser.last_name,
                                body,
                                cancellationToken);
                        }
                    });
                }
            }
            else if (user.type == UserType.Group.GetHashCode())
            {
                ConversationInfo conv = await _chatService.GetConversation(userId, userId, cancellationToken);
                if (conv.deleted)
                    return;

                string mediaPath = null;

                var message = ChatMessage.Generate(userId, senderId, data.text, false, data.type, data.data, data.file_id,
                    mediaPath, user.last_message_counter + 1, true,
                    conv.last_message_counter + 1, data.reply_id, forwardedMessage?.id, forwardUserId);
                await _mongoServices.CreateMessage(message);
                await sqlRepository.UpdateByFilter<Conversation>(
                    s => s.from_id == userId && s.to_id == userId,
                    s => new
                    {
                        last_message_counter = s.last_message_counter + 1, last_message_id = message.id,
                        last_message_date = message.creation_date
                    },
                    cancellationToken);
                await sqlRepository.UpdateByFilter<UserGroup>(
                    s => s.user_id == senderId && s.group_id == userId,
                    s => new { last_seen_counter = conv.last_message_counter + 1 }, cancellationToken);

                var signal1 = new WebsocketModel(MethodCode.send_message, message);

                var signal2 = new WebsocketModel(MethodCode.send_message_resposne, message, identifier);
                var allUsers = await _chatService.GetUserGroupsConnection(userId, cancellationToken);
                var tasks = allUsers.Select(async s =>
                {
                    if (s.user_id != senderId)
                        await websocketHandler.SendMessageToSockets(s.user_id, signal1);
                    else
                        await websocketHandler.SendMessageToSockets(s.user_id, signal2);
                });
                await Task.WhenAll(tasks);


                string body = getMessageSummary(message);
                Task.Run(async () =>
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        PushServiceClient pushClient = scope.ServiceProvider.GetRequiredService<PushServiceClient>();
                        var others = allUsers.Where(s => s.user_id != senderId).ToList();
                        await _pushService.SendNotifications(pushClient, others, userId,
                            senderUser.first_name + " " + senderUser.last_name + " @ " + user.first_name + " " + user.last_name, body,
                            cancellationToken);
                    }
                });
            }
        }
    }

    private string getMessageSummary(ChatMessage message)
    {
        switch ((MessageType)message.type)
        {
            case MessageType.text:
                return message.text.Length < 50 ? message.text : message.text.Substring(0, 47) + "...";
            case MessageType.voice:
                return "voice";
            case MessageType.voice_ogg:
                return "voice";
            case MessageType.file:
                return "file";
            case MessageType.image:
                return "photo";
        }

        return "Unknown message";
    }

    public static async Task MakeCreateGroupMessage(IMongoServices _mongoServices,
        ISqlRepository sqlRepository, Guid fromId, Guid userId, string title,
        CancellationToken cancellationToken)
    {
        string mediaPath = null;
        var data = new SystemMessageData()
        {
            id = fromId,
            type_id = (int)SystemMessageType.create_group,
            value = null
        };
        var message = ChatMessage.Generate(fromId, userId, $"%1 has created the group \"%2\"", false,
            MessageType.system_message,
            JsonConvert.SerializeObject(data), null,
            mediaPath,
            1, true, 1, null, null, null);
        await _mongoServices.CreateMessage(message);
        await sqlRepository.UpdateByFilter<CollabUser>(s => s.id == fromId,
            s => new { last_message_counter = s.last_message_counter + 1 }, cancellationToken);
        await sqlRepository.UpdateByFilter<Conversation>(s => s.from_id == fromId && s.to_id == fromId,
            s => new
            {
                last_message_counter = s.last_message_counter + 1, last_message_id = message.id,
                last_message_date = message.creation_date
            },
            cancellationToken);
    }
}

public class SystemMessageData
{
    public Guid id { get; set; }
    public int type_id { get; set; }
    public string value { get; set; }
}
