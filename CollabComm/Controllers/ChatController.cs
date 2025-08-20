using System.Runtime.InteropServices;
using AutoMapper;
using CollabComm.Core;
using CollabComm.Core.Helpers;
using CollabComm.Core.Models;
using CollabComm.Core.Web.Controllers;
using CollabComm.Core.Web.Extensions;
using CollabComm.DTO;
using CollabComm.InterComm.MongoModels;
using CollabComm.InterComm.Services;
using CollabComm.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace CollabComm.Controllers;

[ApiController]
[Authorize]
[RequestSizeLimit(500_000_000)]
[Route("api/[controller]/[action]/{id?}")]
public class ChatController : BaseController
{
    private readonly string _siteName;
    private readonly IMapper _mapper;
    private readonly IMongoService _mongoService;
    private readonly IWebsocketHandler _websocketHandler;
    private readonly IUserService _userService;
    private readonly IChatService _chatService;


    public ChatController(IApplicationContext app,
        IHttpContextAccessor httpContextAccessor,
        IUserService userService,
        IWebHostEnvironment hostingEnvironment,
        IMapper mapper,
        IMongoService mongoService,
        IWebsocketHandler websocketHandler,
        IChatService chatService) : base(app)
    {
        _mapper = mapper;
        _mongoService = mongoService;
        _websocketHandler = websocketHandler;
        _userService = userService;
        _chatService = chatService;
    }

    [HttpPost]
    public async Task<ResultSet<object>> GetUserByUsername([FromBody] TitleRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var isChatSuperAdmin = await _chatService.IsChatSuperAdmin(App.UserIdGuid, cancellationToken);
        if (!isChatSuperAdmin)
            return new ResultSet<object>() { code = ResponseCodes.Forbidden };
        var user = await _chatService.GetUserByUsername(request.title, cancellationToken);
        if (user == null)
            return new ResultSet<object>(new { user = user }) { code = ResponseCodes.NotFound };
        return new ResultSet<object>(new { user = user });
    }

    [HttpPost]
    public async Task<ResultSet<object>> CommonGroups([FromBody] IdRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        List<CollabUserInfo> groups =
            await _chatService.GetCommonGroup(App.UserIdGuid, request.id, cancellationToken);
        var user = await _userService.GetUserInfo(request.id, cancellationToken);
        return new ResultSet<object>(new { groups = groups, user = user });
    }

    [HttpPost]
    public async Task<ResultSet<object>> Conversations(CancellationToken cancellationToken = default)
    {
        var convs = await _chatService.GetConversations(App.UserIdGuid, cancellationToken);
        var isChatSuperAdmin = await _chatService.IsChatSuperAdmin(App.UserIdGuid, cancellationToken);
        return new ResultSet<object>(
            new { conversations = convs, is_chat_super_admin = isChatSuperAdmin });
    }

    [HttpPost]
    public async Task<ResultSet<object>> ConversationWithUser([FromBody] IdRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var convs = await _chatService.ConversationWithUser(request.id, App.UserIdGuid, cancellationToken);

        if (convs.Item1 != null && convs.Item1.deleted)
            return new ResultSet<object>(null) { code = ResponseCodes.Forbidden };

        return new ResultSet<object>(new { conversation = convs.Item1, user = convs.Item2, user_group = convs.Item3 });
    }

    [HttpPost]
    public async Task<ResultSet<object>> Users([FromBody] GetUserRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var users = await _chatService.GetUsers(request.user_ids, cancellationToken);
        return new ResultSet<object>(users);
    }

    [HttpPost]
    public async Task<ResultSet<object>> MessagesByIds([FromBody] GetMessagesByIdsRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var myGroup = await _chatService.MyGroups(App.UserIdGuid, cancellationToken);
        var gpIds = myGroup.Select(s => s.group_id);
        var messages =
            await _mongoService.GetMessagesByIds(App.UserIdGuid, gpIds.ToList(), request.ids,
                cancellationToken);
        return new ResultSet<object>(messages);
    }

    [HttpPost]
    public async Task<ResultSet<object>> DeleteMessage([FromBody] IdTitleRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var selfId = App.UserIdGuid;
        var user = await _userService.GetUserInfo(request.id, cancellationToken);
        var message = await _mongoService.GetMessageById(request.title, cancellationToken);
        var fromId = user.type == (int)UserType.Group ? user.id : user.id;
        var pairMessage = await _mongoService.GetMessageByPairId(user.type == (int)UserType.Group, fromId,
            request.title, cancellationToken);
        if (user.type == (int)UserType.User)
        {
            if (message.from_id != selfId && message.to_id != selfId)
                return new ResultSet<object>() { code = ResponseCodes.Forbidden };

            await _mongoService.DeleteMessage(selfId, request.id, request.title,
                cancellationToken);

            var conv2 = await _chatService.GetConversation(selfId, request.id, cancellationToken);
            if (conv2.last_message_id == request.title)
            {
                var lastmsg =
                    await _mongoService.GetOneMessageByFromIdAndToId(false, selfId, request.id, cancellationToken);
                await _chatService.UpdateConversationLastMessage(selfId, request.id, lastmsg, cancellationToken);
            }


            var deleteModelFrom = new DeleteMessageModel(request.title);
            var syncFrom = new SyncModel(App.UserIdGuid, request.id, SyncMethod.delete, deleteModelFrom);
            var syncSignalFrom = new WebsocketModel(MethodCode.sync, syncFrom);
            await _websocketHandler.SendMessageToSockets(App.UserIdGuid, syncSignalFrom);


            if (message.from_id != message.to_id)
            {
                await _mongoService.DeleteMessage(request.id, selfId, pairMessage.id,
                    cancellationToken);
                var conv1 = await _chatService.GetConversation(request.id, selfId, cancellationToken);
                if (conv1.last_message_id == pairMessage.id)
                {
                    var lastmsg =
                        await _mongoService.GetOneMessageByFromIdAndToId(false, request.id, selfId, cancellationToken);
                    await _chatService.UpdateConversationLastMessage(request.id, selfId, lastmsg, cancellationToken);
                }

                var deleteModelTo = new DeleteMessageModel(pairMessage.id);
                var syncTo = new SyncModel(App.UserIdGuid, request.id, SyncMethod.delete, deleteModelTo);
                var deletesyncSignalTo = new WebsocketModel(MethodCode.sync, syncTo);
                await _websocketHandler.SendMessageToSockets(request.id, deletesyncSignalTo);
            }
        }
        else if (user.type == (int)UserType.Group)
        {
            var userGroup = await _chatService.GetUserGroup(selfId, request.id, cancellationToken);
            if (message.to_id != selfId && !userGroup.is_admin == true && !userGroup.is_owner == true)
                return new ResultSet<object>(false) { code = ResponseCodes.Forbidden };
            var conv1 = await _chatService.GetConversation(request.id, request.id, cancellationToken);

            await _mongoService.DeleteMessage(request.id, selfId, request.title,
                cancellationToken);
            if (conv1.last_message_id == request.title)
            {
                var lastmsg = await _mongoService.GetOneMessageByFromId(true, request.id, cancellationToken);
                await _chatService.UpdateConversationLastMessage(request.id, request.id, lastmsg, cancellationToken);
            }

            var deleteModel = new DeleteMessageModel(request.title);
            var sync = new SyncModel(App.UserIdGuid, request.id, SyncMethod.delete, deleteModel);
            var deleteSyncSignal = new WebsocketModel(MethodCode.sync, sync);
            await _websocketHandler.SendMessageToGroup(request.id, deleteSyncSignal);
        }
        else
            return new ResultSet<object>() { code = ResponseCodes.Forbidden };


        return new ResultSet<object>(true);
    }

    [HttpPost]
    public async Task<ResultSet<object>> MessagesByCounter([FromBody] GetMessagesByCounterRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userService.GetUserInfo(request.user_id, cancellationToken);
        Guid fromId = user.type == (int)UserType.Group ? request.user_id : App.UserIdGuid;
        Guid toId = user.type == (int)UserType.Group ? request.user_id : App.UserIdGuid;
        List<ChatMessageInfo> messages;
        if (user.type == (int)UserType.Group || user.type == (int)UserType.Channel)
        {
            var isMember = await _chatService.IsMemberOfGroup(request.user_id, App.UserIdGuid, cancellationToken);
            if (!isMember)
            {
                var isSuperAdmin = await _chatService.IsChatSuperAdmin(App.UserIdGuid, cancellationToken);
                if (!isSuperAdmin)
                    return new ResultSet<object>() { code = ResponseCodes.Forbidden };
            }

            var conv = await _chatService.GetConversation(request.user_id, request.user_id, cancellationToken);
            if (conv.deleted)
                return new ResultSet<object>() { code = ResponseCodes.Forbidden };
            messages = await _mongoService.GetMessagesByFromId(true, request.user_id, request.counter,
                request.is_previous,
                50, cancellationToken);
        }
        else
        {
            var conv = await _chatService.GetConversation(App.UserIdGuid, request.user_id, cancellationToken);
            if (conv != null && conv.deleted)
                return new ResultSet<object>() { code = ResponseCodes.Forbidden };
            messages = await _mongoService.GetMessagesByFromIdAndToId(false, App.UserIdGuid, request.user_id,
                request.counter, request.is_previous, 50, cancellationToken);
        }

        return new ResultSet<object>(messages);
    }


    [HttpPost]
    public async Task<ResultSet<object>> MessagesByReplyId([FromBody] GetMessagesByCounterRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var message = await _mongoService.GetMessageById(request.reply_id, cancellationToken);
        var user = await _userService.GetUserInfo(request.user_id, cancellationToken);
        Guid fromId = user.type == (int)UserType.Group ? request.user_id : App.UserIdGuid;
        Guid toId = user.type == (int)UserType.Group ? request.user_id : App.UserIdGuid;
        List<ChatMessageInfo> messages = new List<ChatMessageInfo>();
        if (user.type == (int)UserType.Group)
        {
            var isMember = await _chatService.IsMemberOfGroup(request.user_id, App.UserIdGuid, cancellationToken);
            if (!isMember)
                return new ResultSet<object>() { code = ResponseCodes.Forbidden };
            var prvMessages = await _mongoService.GetMessagesByFromId(true, request.user_id,
                message.conversation_counter, true, 19,
                cancellationToken);
            var nextMessages = await _mongoService.GetMessagesByFromId(true, request.user_id,
                message.conversation_counter, false, 30,
                cancellationToken);
            messages.AddRange(prvMessages);
            messages.Add(message);
            messages.AddRange(nextMessages);
        }
        else
        {
            var prvMessages = await _mongoService.GetMessagesByFromIdAndToId(false, App.UserIdGuid,
                request.user_id,
                message.conversation_counter, true, 19, cancellationToken);
            var nextMessages = await _mongoService.GetMessagesByFromIdAndToId(false, App.UserIdGuid,
                request.user_id,
                message.conversation_counter, false, 30, cancellationToken);
            messages.AddRange(prvMessages);
            messages.Add(message);
            messages.AddRange(nextMessages);
        }

        return new ResultSet<object>(messages);
    }


    [HttpPost]
    public async Task<ResultSet<object>> CreateGroup([FromBody] TitleRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var conv = await _chatService.CreateGroup(App.UserIdGuid, request.title, cancellationToken);
        return new ResultSet<object>(
            new { conversations = new List<ConversationInfo>() { conv } });
    }

    [HttpPost]
    public async Task<ResultSet<object>> AddToGroup([FromBody] AddToGroupRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        await _chatService.AddToGroup(request.group_id, request.user_ids, cancellationToken);
        return new ResultSet<object>(true);
    }

    [HttpPost]
    public async Task<ResultSet<List<UserGroupInfo>>> GroupMembers([FromBody] IdRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var r = await _chatService.GroupMembers(App.UserIdGuid, request.id, cancellationToken);
        return new ResultSet<List<UserGroupInfo>>(r);
    }

    [HttpPost]
    public async Task<ResultSet<object>> Seen([FromBody] SeenRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var isSuperAdmin = await _chatService.IsChatSuperAdmin(App.UserIdGuid, cancellationToken);
        if (isSuperAdmin)
        {
            return new ResultSet<object>(false);
        }

        var user = await _userService.GetUserInfo(request.user_id, cancellationToken);
        var fromId = request.user_id;
        var toId = user.type == (int)UserType.Group ? request.user_id : App.UserIdGuid;
        // await _mongoServices.updateSeenStatus(user.type == (int)UserType.Group, fromId, toId, request.counter,
        //     cancellationToken);
        if (user.type == (int)UserType.Group)
        {
            await _chatService.UpdateUserGroupLastSeenCounter(App.UserIdGuid, request.user_id, request.counter,
                cancellationToken);
            if (request.id != null)
            {
                var seen = new SeenModel(request.id, request.counter);
                var sync = new SyncModel(App.UserIdGuid, request.user_id, SyncMethod.seen, seen);
                var seenSyncSignal = new WebsocketModel(MethodCode.sync, sync);
                await _websocketHandler.SendMessageToGroup(request.user_id, seenSyncSignal);
            }
        }
        else
        {
            await _chatService.UpdateConversationLastSeenCounter(App.UserIdGuid, request.user_id, request.counter,
                cancellationToken);

            if (user.id != App.UserIdGuid)
            {
                long pairMessageCounter;
                ChatMessageInfo pairMessage;
                if (request.id != null)
                {
                    var msg = await _mongoService.GetMessageById(request.id, cancellationToken);
                    if (msg.pair_id != null)
                    {
                        pairMessage = await _mongoService.GetMessageById(msg.pair_id, cancellationToken);
                        pairMessageCounter = pairMessage.conversation_counter;
                    }
                    else
                    {
                        pairMessage = await _mongoService.GetMessageByPairId(false,
                            request.user_id, request.id, cancellationToken);
                        pairMessageCounter = pairMessage.conversation_counter;
                    }

                    await _chatService.UpdateConversationLastReadCounter(App.UserIdGuid, request.user_id,
                        request.counter,
                        cancellationToken);
                    var seen = new SeenModel(pairMessage.id, pairMessageCounter);
                    var sync = new SyncModel(App.UserIdGuid, request.user_id, SyncMethod.seen, seen);
                    var seenSyncSignal = new WebsocketModel(MethodCode.sync, sync);
                    await _websocketHandler.SendMessageToSockets(request.user_id, seenSyncSignal);
                }
                else
                {
                    await _chatService.UpdateConversationLastReadCounterForSelfChat(App.UserIdGuid, request.user_id,
                        request.counter, cancellationToken);
                }
            }
        }

        return new ResultSet<object>(true);
    }

    [HttpPost]
    public async Task<ResultSet<object>> AddContact([FromBody] TitleTitleRequestDTO request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userService.GetUser(request.title, cancellationToken);
        if (user == null) 
            return new ResultSet<object>() { code = ResponseCodes.WrongArgument };
        var oldContact = await _chatService.GetContact(App.UserIdGuid, user.id, cancellationToken);
        if (oldContact != null)
            return new ResultSet<object>() { code = ResponseCodes.DuplicateKeyField };
        await _chatService.AddContact(App.UserIdGuid, user.id, user.username, request.second_title, cancellationToken);
        return new ResultSet<object>(true);
    }


    [HttpPost]
    public async Task<ResultSet<object>> Contacts(CancellationToken cancellationToken = default)
    {
        var contacts = await _chatService.GetContacts(App.UserIdGuid, cancellationToken);
        return new ResultSet<object>(new { contacts });
    }

    [HttpGet]
    public async Task<object> ChatMedia(string id, [FromQuery] bool is_group,
        CancellationToken cancellationToken = default)
    {
        if (!ObjectId.TryParse(id, out _))
            return NotFound().AddCacheValue(HttpContext, 12);


        string mediaId = null;
        var msg = await _mongoService.GetMessageById(id, cancellationToken);
        if (msg == null || msg.deleted == true || msg.media_id == null)
            return null;
        if (is_group)
        {
            var isMember = await _chatService.IsMemberOfGroup(msg.from_id, App.UserIdGuid, cancellationToken);
            if (!isMember)
            {
                var isChatSuperAdmin = await _chatService.IsChatSuperAdmin(App.UserIdGuid, cancellationToken);
                if (!isChatSuperAdmin)
                    return null;
            }
        }
        else
        {
            if (msg.from_id != App.UserIdGuid && msg.to_id != App.UserIdGuid)
                return null;
        }

        mediaId = msg.media_id;
        var media = await _chatService.GetChatMedia(mediaId, App.UserIdGuid, cancellationToken);
        if (media != null)
        {
            string path = media.path;
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                path = path.Replace("/", "\\");
            else
                path = path.Replace("\\", "/");
            string fullPath = Path.Combine(CollabCommPathHelper.GetUserFilesMainPath, path);
            if (!System.IO.File.Exists(fullPath))
                return null;
            byte[] bytes = await System.IO.File.ReadAllBytesAsync(fullPath, cancellationToken);
            if (media.mime_type.ToLower().Contains("image"))
            {
                HttpContext.Response.Headers.AddDefaultCacheValue();
            }

            HttpContext.Response.Headers.AddDefaultCacheValue();
            return File(bytes, media.mime_type, Path.GetFileName(fullPath));
        }

        HttpContext.Response.Headers.AddDefaultCacheValue();
        return null;
    }

    [HttpGet]
    public async Task<object> ThumbnailChatMedia(string id, [FromQuery] bool is_group,
        CancellationToken cancellationToken = default)
    {
        string mediaId = null;
        var msg = await _mongoService.GetMessageById(id, cancellationToken);
        if (msg == null || msg.deleted == true || msg.media_id == null)
            return null;
        if (is_group)
        {
            var isMember = await _chatService.IsMemberOfGroup(msg.from_id, App.UserIdGuid, cancellationToken);
            if (!isMember)
                return null;
        }
        else
        {
            if (msg.from_id != App.UserIdGuid && msg.to_id != App.UserIdGuid)
                return null;
        }

        mediaId = msg.media_id;
        var media = await _chatService.GetChatMedia(mediaId, App.UserIdGuid, cancellationToken);
        if (media != null)
        {
            string path = media.path.Replace("chat_media", "thumbnail_chat_media");
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                path = path.Replace("/", "\\");
            else
                path = path.Replace("\\", "/");
            string fullPath = Path.Combine(CollabCommPathHelper.GetUserFilesMainPath, path);
            if (System.IO.File.Exists(fullPath))
            {
                byte[] bytes = await System.IO.File.ReadAllBytesAsync(fullPath, cancellationToken);
                HttpContext.Response.Headers.AddDefaultCacheValue();
                return File(bytes, media.mime_type, Path.GetFileName(fullPath));
            }
            else
            {
                HttpContext.Response.Headers.AddDefaultCacheValue();
                return Content("File not exists");
            }
        }

        HttpContext.Response.Headers.AddDefaultCacheValue();
        return null;
    }

    [HttpPost]
    public async Task<ResultSet<object>> AddChatMedia(
        [ModelBinder(BinderType = typeof(JsonModelBinder))]
        AddChatMediaRequestDTO model, IFormFile file,
        CancellationToken cancellationToken = default)
    {
        string path = "";
        if (file.Length > 0)
        {
            var dirPath = Path.Combine(CollabCommPathHelper.GetUserFilesMainPath, "chat_media");
            if (!Directory.Exists(dirPath))
                Directory.CreateDirectory(dirPath);
            var userDirPath = Path.Combine(dirPath, App.UserId);
            if (!Directory.Exists(userDirPath))
                Directory.CreateDirectory(userDirPath);

            var fullPath = Path.Combine(userDirPath, file.FileName);
            using (var fileStream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream, cancellationToken);
            }

            path = Path.Combine("chat_media", App.UserId);
            path = Path.Combine(path, file.FileName);
            var targetUser = await _userService.GetUserInfo(model.user_id, cancellationToken);
            var fromId = targetUser.type == (int)UserType.User ? App.UserIdGuid : model.user_id;
            var toId = targetUser.type == (int)UserType.User ? model.user_id : model.user_id;
            var userMedia = await _chatService.AddChatMedia(fromId, toId, model.type,
                model.MimeType,
                path, cancellationToken);
            return new ResultSet<object>(userMedia.id);
        }
        else
        {
            throw new Exception("File is empty !");
        }
    }

    [HttpPost]
    public async Task<ResultSet<object>> AddThumbnailChatMedia(
        [ModelBinder(BinderType = typeof(JsonModelBinder))]
        AddChatMediaRequestDTO model, IFormFile file,
        CancellationToken cancellationToken = default)
    {
        string path = "";
        if (file.Length > 0)
        {
            var dirPath = Path.Combine(CollabCommPathHelper.GetUserFilesMainPath, "thumbnail_chat_media");
            if (!Directory.Exists(dirPath))
                Directory.CreateDirectory(dirPath);
            var userDirPath = Path.Combine(dirPath, App.UserId);
            if (!Directory.Exists(userDirPath))
                Directory.CreateDirectory(userDirPath);

            var fullPath = Path.Combine(userDirPath, file.FileName);
            using (var fileStream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            // path = Path.Combine("chat_media_thumbnail", App.UserId);
            // path = Path.Combine(path, file.FileName);
            // var targetUser = await _mainService.GetUserInfo(model.user_id, cancellationToken);
            // var fromId = targetUser.type == (int)UserType.User ? App.UserIdGuid : model.user_id;
            // var toId = targetUser.type == (int)UserType.User ? model.user_id : model.user_id;
            // var userMedia = await _mainService.AddChatMedia(fromId, toId, model.type,
            //     model.MimeType,
            //     path, cancellationToken);
            return new ResultSet<object>(true);
        }
        else
        {
            return null;
        }
    }
}