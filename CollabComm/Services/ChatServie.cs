using AutoMapper;
using CollabComm.Core.Models;
using CollabComm.InterComm.Models;
using CollabComm.InterComm.MongoModels;
using CollabComm.InterComm.Repositories;
using CollabComm.Models;
using Microsoft.EntityFrameworkCore;

namespace CollabComm.Services;

public interface IChatService
{
    Task<ConversationInfo> CreateGroup(Guid userId, string title, CancellationToken cancellationToken);

    Task AddToGroup(Guid gpid, List<Guid> userIds, CancellationToken cancellationToken);


    Task<UserGroupInfo> AddToGroup(Guid gpid, Guid userId, bool isAdmin, bool isOwner,
        CancellationToken cancellationToken);

    Task DeleteFromUserGroup(Guid gpid, Guid userId, CancellationToken cancellationToken);
    Task<bool> IsMemberOfGroup(Guid fromId, Guid userId, CancellationToken cancellationToken);
    Task<List<CollabUserInfo>> GetCommonGroup(Guid userId, Guid requestId, CancellationToken cancellationToken);
    Task<bool> IsChatSuperAdmin(Guid userid, CancellationToken cancellationToken);
    Task<CollabUserInfo> GetUserByUsername(string username, CancellationToken cancellationToken);
    Task<List<UserGroupInfo>> GroupMembers(Guid guid, Guid requestId, CancellationToken cancellationToken);
    Task<List<UserGroupInfo>> GetUserGroups(Guid userId, CancellationToken cancellationToken);
    Task<ConversationInfo> GetConversation(Guid fromId, Guid toId, CancellationToken cancellationToken);
    Task<ConversationInfo> CreateConversation(Conversation conv, CancellationToken cancellationToken);
    Task<List<UserGroupInfo>> GetUserGroupsConnection(Guid userId, CancellationToken cancellationToken);
    Task<List<ConversationInfo>> GetConversations(Guid userId, CancellationToken cancellationToken);

    Task<UserGroupInfo> GetUserGroup(Guid userId, Guid fromId,
        CancellationToken cancellationToken);

    Task<Tuple<ConversationInfo, CollabUserInfo, UserGroupInfo>> ConversationWithUser(Guid requestId,
        Guid userId, CancellationToken cancellationToken);

    Task<List<ContactInfo>> GetContacts(Guid userId, CancellationToken cancellationToken);
    Task<ContactInfo> GetContact(Guid userId,Guid targetId, CancellationToken cancellationToken);

    Task<ContactInfo> AddContact(Guid userId, Guid targetId, string username,string title,
        CancellationToken cancellationToken);

    Task<List<CollabUserInfo>> GetUsers(List<Guid> userIds, CancellationToken cancellationToken);
    Task<List<UserGroupInfo>> MyGroups(Guid guid, CancellationToken cancellationToken);

    Task<bool> UpdateConversationLastMessage(Guid fromId, Guid toId, ChatMessageInfo lastmsg,
        CancellationToken cancellationToken);

    Task<bool> UpdateUserGroupLastSeenCounter(Guid userId, Guid groupId, long counter,
        CancellationToken cancellationToken);

    Task<bool> UpdateConversationLastSeenCounter(Guid userId, Guid toId, long counter,
        CancellationToken cancellationToken);

    Task<bool> UpdateConversationLastReadCounter(Guid userId, Guid toId, long counter,
        CancellationToken cancellationToken);

    Task<bool> UpdateConversationLastReadCounterForSelfChat(Guid userId, Guid toId, long counter,
        CancellationToken cancellationToken);

    Task<ChatMediaInfo> GetChatMedia(string id, Guid user_id, CancellationToken cancellationToken);

    Task<ChatMediaInfo> AddChatMedia(Guid from_id, Guid to_id, int type, string mimeType, string path,
        CancellationToken cancellationToken);
}

public class ChatService : IChatService
{
    private readonly IMapper _mapper;
    private readonly ISqlRepository _sqlRepository;
    private readonly IMongoService _mongoService;
    private readonly IUserService _userService;
    private readonly DatabaseContext _dbContext;


    public ChatService(
        IMapper mapper,
        ISqlRepository sqlRepository,
        DatabaseContext dbContext,
        IUserService userService,
        IMongoService mongoService)
    {
        _mapper = mapper;
        _sqlRepository = sqlRepository;
        _dbContext = dbContext;
        _mongoService = mongoService;
        _userService = userService;
    }

    public async Task<ChatMediaInfo> AddChatMedia(Guid from_id, Guid to_id, int type, string mimeType, string path,
        CancellationToken cancellationToken)
    {
        var media = ChatMedia.Generate(from_id, to_id, type, mimeType, path);
        await _mongoService.InsertChatMedia(media);
        return _mapper.Map<ChatMediaInfo>(media);
    }

    public async Task<ChatMediaInfo> GetChatMedia(string id, Guid user_id, CancellationToken cancellationToken)
    {
        var media = await _mongoService.GetChatMedia(id);
        if (media.from_id == media.to_id && user_id != media.from_id)
        {
            var userGroup = await GetMyUserGroup(media.from_id, user_id, cancellationToken);
            if (userGroup == null)
                media = null;
        }
        else if (media.from_id != user_id && media.to_id != user_id)
            media = null;

        return _mapper.Map<ChatMediaInfo>(media);
    }

    public async Task<UserGroupInfo> GetMyUserGroup(Guid groupId, Guid userId,
        CancellationToken cancellationToken)
    {
        var list = (await _sqlRepository.GetByFilter<UserGroup>(
            s => s.group_id == groupId && s.user_id == userId && s.deleted == false,
            cancellationToken)).SingleOrDefault();
        return _mapper.Map<UserGroupInfo>(list);
    }

    public async Task<bool> UpdateConversationLastSeenCounter(Guid userId, Guid toId, long counter,
        CancellationToken cancellationToken)
    {
        return await _sqlRepository.UpdateByFilter<Conversation>(
            s => s.from_id == userId && s.to_id == toId,
            s => new
            {
                last_seen_counter = counter == 0 ? 0 : Math.Max(counter, s.last_seen_counter)
            },
            cancellationToken);
    }

    public async Task<bool> UpdateConversationLastReadCounter(Guid userId, Guid toId, long counter,
        CancellationToken cancellationToken)
    {
        return await _sqlRepository.UpdateByFilter<Conversation>(
            s => s.from_id == userId && s.to_id == toId,
            s => new { last_read_counter = Math.Max(counter, s.last_read_counter) },
            cancellationToken);
    }

    public async Task<bool> UpdateConversationLastReadCounterForSelfChat(Guid userId, Guid toId, long counter,
        CancellationToken cancellationToken)
    {
        return await _sqlRepository.UpdateByFilter<Conversation>(
            s => s.from_id == toId && s.to_id == userId,
            s => new { last_read_counter = Math.Max(0, s.last_read_counter) },
            cancellationToken);
    }

    public async Task<bool> UpdateUserGroupLastSeenCounter(Guid userId, Guid groupId, long counter,
        CancellationToken cancellationToken)
    {
        var v = await _sqlRepository.UpdateByFilter<UserGroup>(
            s => s.group_id == groupId && s.user_id == userId,
            s => new { last_seen_counter = Math.Max(counter, s.last_seen_counter) },
            cancellationToken);
        await _sqlRepository.UpdateByFilter<Conversation>(
            s => s.from_id == groupId && s.to_id == groupId,
            s => new
            {
                last_seen_counter = Math.Max(counter, s.last_seen_counter),
                last_read_counter = Math.Max(counter, s.last_read_counter)
            }, cancellationToken);
        return v;
    }

    public async Task<bool> UpdateConversationLastMessage(Guid fromId, Guid toId, ChatMessageInfo lastmsg,
        CancellationToken cancellationToken)
    {
        var lastConvMessageCounter = lastmsg?.conversation_counter ?? 0;
        var lastMsgId = lastmsg?.id ?? "";
        return await _sqlRepository.UpdateByFilter<Conversation>(
            s => s.from_id == fromId && s.to_id == toId,
            s => new
            {
                last_message_counter = lastConvMessageCounter, last_message_id = lastMsgId,
                last_message_date = lastmsg.creation_date
            },
            cancellationToken);
    }

    public async Task<List<UserGroupInfo>> MyGroups(Guid guid, CancellationToken cancellationToken)
    {
        var list = await _sqlRepository.GetByFilter<UserGroup>(s => s.user_id == guid,
            cancellationToken);
        return _mapper.Map<List<UserGroupInfo>>(list);
    }

    public async Task<List<CollabUserInfo>> GetUsers(List<Guid> userIds, CancellationToken cancellationToken)
    {
        var q = (from u in _dbContext.collab_user
            where userIds.Contains(u.id)
            select new { u }).Select(s => _mapper.Map<CollabUserInfo>(s.u)).ToList();
        return q;
    }

    public async Task<ContactInfo> AddContact(Guid userId, Guid targetId, string username,string title,
        CancellationToken cancellationToken)
    {
        var item = new Contact()
        {
            user_id = userId,
            target_id = targetId,
            username = username,
            title = title
        };
        var q = (await _sqlRepository.Insert(item));
        return _mapper.Map<ContactInfo>(q);
    }

    public async Task<List<ContactInfo>> GetContacts(Guid userId, CancellationToken cancellationToken)
    {
        var q1 = from c in _dbContext.contact
            join u in _dbContext.collab_user
                on c.target_id equals u.id
            where c.deleted == false && c.user_id == userId
            orderby c.title
            select new { c, u };

        var q = await q1.ToListAsync(cancellationToken);
        var q2 = q.Select(s => _mapper.Map<ContactInfo>(s.c).SetUser(_mapper.Map<CollabUserInfo>(s.u)))
            .ToList();
        return q2;
    }

    public async Task<ContactInfo> GetContact(Guid userId,Guid targetId, CancellationToken cancellationToken)
    {
        var q = (await _sqlRepository.GetByFilter<Contact>(s => s.user_id == userId && s.target_id == targetId))
            .FirstOrDefault();
        return _mapper.Map<ContactInfo>(q);
    }

    public async Task<List<ConversationInfo>> GetConversations(Guid userId,
        CancellationToken cancellationToken)
    {
        var q1 = from c in _dbContext.conversation
            join ug in _dbContext.user_group
                on c.from_id equals ug.group_id into res1
            from ug in res1.DefaultIfEmpty()
            where c.deleted == false && (c.from_id == userId ||
                                         (c.from_id == c.to_id && ug.user_id == userId && ug.deleted == false))
            orderby c.last_message_date descending
            select new { c, ug };

        var q = await q1.ToListAsync(cancellationToken);
        var q2 = q.Select(s => _mapper.Map<ConversationInfo>(s.c).SetUserGroup(_mapper.Map<UserGroupInfo>(s.ug)))
            .ToList();
        return q2;
    }

    public async Task<Tuple<ConversationInfo, CollabUserInfo, UserGroupInfo>> ConversationWithUser(Guid requestId,
        Guid userId, CancellationToken cancellationToken)
    {
        var u = await _userService.GetUserInfo(requestId, cancellationToken);
        Guid fromId = u.type == (int)UserType.Group ? requestId : userId;
        Guid toId = u.type == (int)UserType.Group ? requestId : requestId;
        var c = await this.GetConversation(fromId, toId, cancellationToken);
        UserGroupInfo ug = null;
        if (fromId == toId)
        {
            ug = await GetUserGroup(userId, fromId, cancellationToken);
        }

        return new Tuple<ConversationInfo, CollabUserInfo, UserGroupInfo>(c, u, ug);
    }

    public async Task<UserGroupInfo> GetUserGroup(Guid userId, Guid fromId,
        CancellationToken cancellationToken)
    {
        var q = (await _sqlRepository.GetByFilter<UserGroup>(
            s => s.user_id == userId && s.group_id == fromId,
            cancellationToken)).SingleOrDefault();
        return _mapper.Map<UserGroupInfo>(q);
    }

    public async Task<List<UserGroupInfo>> GetUserGroupsConnection(Guid userId, CancellationToken cancellationToken)
    {
        var x = (from ug in _dbContext.user_group
            join c0 in _dbContext.session.Where(s =>
                    s.deleted == false && (DateTime.UtcNow - s.last_online_date).Value.Days < 7) on ug.user_id equals
                c0.user_id into res1
            from c in res1.DefaultIfEmpty()
            where ug.group_id == userId && ug.deleted == false
            select new { ug, c }).ToList();
        var groupBy = x.GroupBy(s => s.ug.user_id);
        var q = groupBy.Select(s => _mapper.Map<UserGroupInfo>(s.First().ug)
            .SetSessions(_mapper.Map<List<SessionInfo>>(s.Select(s2 => s2.c)))
        );
        return q.ToList();
    }

    public async Task<ConversationInfo> CreateConversation(Conversation conv, CancellationToken cancellationToken)
    {
        var x = await _sqlRepository.Insert(conv, cancellationToken);
        return _mapper.Map<ConversationInfo>(x);
    }

    public async Task<ConversationInfo> GetConversation(Guid fromId, Guid toId, CancellationToken cancellationToken)
    {
        var x = (await _sqlRepository.GetByFilter<Conversation>(
            s => s.from_id == fromId && s.to_id == toId,
            cancellationToken)).SingleOrDefault();
        return _mapper.Map<ConversationInfo>(x);
    }

    public async Task<List<UserGroupInfo>> GetUserGroups(Guid userId, CancellationToken cancellationToken)
    {
        var list = await _sqlRepository.GetByFilter<UserGroup>(
            s => s.group_id == userId && s.deleted == false,
            cancellationToken);
        return _mapper.Map<List<UserGroupInfo>>(list);
    }

    public async Task<List<UserGroupInfo>> GroupMembers(Guid userId, Guid groupId,
        CancellationToken cancellationToken)
    {
        var x = (from ug in _dbContext.user_group
            join u in _dbContext.collab_user on ug.user_id equals u.id
            where ug.group_id == groupId && u.deleted == false && ug.deleted == false
            select new { ug, u }).ToList();
        var q = x.Select(s => _mapper.Map<UserGroupInfo>(s.ug)
            .SetUser(_mapper.Map<CollabUserInfo>(s.u))
        ).ToList();
        if (q.All(s => s.user_id != userId))
        {
            var isChatSuperAdmin = await this.IsChatSuperAdmin(userId, cancellationToken);
            if (!isChatSuperAdmin)
                return null;
        }

        return q;
    }

    public async Task<CollabUserInfo> GetUserByUsername(string username, CancellationToken cancellationToken)
    {
        var q = (await _sqlRepository.GetByFilter<CollabUser>(s => s.first_name == username, cancellationToken))
            .FirstOrDefault();
        return _mapper.Map<CollabUserInfo>(q);
    }

    public async Task<bool> IsChatSuperAdmin(Guid userId, CancellationToken cancellationToken)
    {
        var query = (from ur in _dbContext.user_role
            join r in _dbContext.role on ur.role_id equals r.id
            where ur.user_id == userId && r.title == "ChatSuperAdmin"
            select new { ur, r });
        var list = query.ToList();
        var ur1 = list.FirstOrDefault()?.ur;
        return ur1 != null;
    }

    public async Task<bool> IsMemberOfGroup(Guid fromId, Guid userId, CancellationToken cancellationToken)
    {
        var item = (await _sqlRepository.GetByFilter<UserGroup>(
            s => s.group_id == fromId && s.user_id == userId && s.deleted == false,
            cancellationToken)).SingleOrDefault();
        return item != null;
    }

    public async Task<List<CollabUserInfo>> GetCommonGroup(Guid userId, Guid targetId,
        CancellationToken cancellationToken)
    {
        var x = (from u in _dbContext.collab_user
            join ug1 in _dbContext.user_group on u.id equals ug1.group_id
            join ug2 in _dbContext.user_group on ug1.group_id equals ug2.group_id
            where ug1.user_id == userId && ug2.user_id == targetId && ug1.deleted == false && ug2.deleted == false
            select u);
        return _mapper.Map<List<CollabUserInfo>>(x);
    }

    public async Task<ConversationInfo> CreateGroup(Guid userId, string title,
        CancellationToken cancellationToken)
    {
        var user = await _sqlRepository.Insert(
            new CollabUser() { first_name = title, type = (int)UserType.Group },
            cancellationToken);
        var gp = await _sqlRepository.Insert(
            UserGroup.GenerateForAdmin(user.id, userId, true, true),
            cancellationToken);
        var conversation =
            await _sqlRepository.Insert(
                Conversation.Generate(user.id, user.id),
                cancellationToken);

        var conv = _mapper.Map<ConversationInfo>(conversation);
        await ProcessMessage.MakeCreateGroupMessage(_mongoService, _sqlRepository, conv.from_id, userId,
            title, cancellationToken);
        return conv;
    }


    public async Task<UserGroupInfo> AddToGroup(Guid gpid, Guid userId, bool isAdmin, bool isOwner,
        CancellationToken cancellationToken)
    {
        var currentUgs = (await _sqlRepository.GetByFilter<UserGroup>(
            s2 => s2.group_id == gpid && s2.user_id == userId,
            cancellationToken)).ToList();
        UserGroup currentUg;
        if (currentUgs.Count > 1)
        {
            currentUg = currentUgs.Where(s => s.is_admin == isAdmin && s.is_owner == isOwner).FirstOrDefault();
            foreach (var userGroup in currentUgs)
            {
                if (userGroup.id == currentUg.id)
                    continue;
                await _sqlRepository.UpdateByFilter<UserGroup>(x => x.id == userGroup.id,
                    s => new { deleted = true },
                    cancellationToken);
            }
        }
        else
            currentUg = currentUgs.FirstOrDefault();

        if (currentUg != null)
        {
            if (currentUg.deleted == true)
                await _sqlRepository.UpdateByFilter<UserGroup>(x => x.id == currentUg.id,
                    s => new { deleted = false },
                    cancellationToken);
            return null;
        }

        var s = UserGroup.Generate(gpid, userId, false, false);
        var x = await _sqlRepository.Insert(s, cancellationToken);
        return _mapper.Map<UserGroupInfo>(x);
    }

    public async Task AddToGroup(Guid gpid, List<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var list = userIds.Select(async s =>
        {
            var currentUg = (await _sqlRepository.GetByFilter<UserGroup>(
                s2 => s2.group_id == gpid && s2.user_id == s,
                cancellationToken)).FirstOrDefault();

            if (currentUg != null)
            {
                if (currentUg.deleted == true)
                    await _sqlRepository.UpdateByFilter<UserGroup>(x => x.id == currentUg.id,
                        s => new { deleted = false },
                        cancellationToken);
                return null;
            }

            return UserGroup.Generate(gpid, s, false, false);
        }).Select(t => t.Result).Where(s => s != null).ToList();
        var x = await _sqlRepository.InsertMany(list, cancellationToken);
    }

    public async Task DeleteFromUserGroup(Guid gpid, Guid userId, CancellationToken cancellationToken)
    {
        // var currentUg = (await _sqlReservationRepository.GetByFilter<UserGroup>(
        //     s2 => s2.group_id == gpid && s2.user_id == userId,
        //     cancellationToken)).FirstOrDefault();
        await _sqlRepository.UpdateByFilter<UserGroup>(s => s.group_id == gpid && s.user_id == userId,
            s => new { deleted = true }, cancellationToken);
    }
}