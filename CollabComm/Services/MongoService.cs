using AutoMapper;
using CollabComm.Core.Models;
using CollabComm.InterComm.MongoModels;
using CollabComm.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace CollabComm.Services;

public interface IMongoService
{
    Task<List<ChatMessageInfo>> GetMessagesByIds(Guid user_id, List<Guid> gps, List<string> ids,
        CancellationToken cancellationToken);

    Task<ChatMessageInfo> GetMessageById(string id, CancellationToken cancellationToken);
    Task DeleteMessage(Guid from_id, Guid to_id, string id, CancellationToken cancellationToken);
    Task<ChatMessageInfo> GetMessageByPairId(bool isGroup, Guid fromId, string id, CancellationToken cancellationToken);

    Task<List<ChatMessageInfo>> GetMessagesByFromIdAndToId(bool isGroup, Guid from_id, Guid to_id,
        long? counter, bool isPrevious, int limit, CancellationToken cancellationToken);

    Task<ChatMessageInfo> GetOneMessageByFromIdAndToId(bool isGroup, Guid from_id, Guid to_id,
        CancellationToken cancellationToken);

    Task<ChatMessageInfo> GetOneMessageByFromId(bool isGroup, Guid from_id,
        CancellationToken cancellationToken);

    Task CreateMessage(ChatMessage message);

    Task<List<ChatMessageInfo>> GetMessagesByFromId(bool isGroup, Guid from_id, long? counter, bool isPrevious,
        int limit, CancellationToken cancellationToken);

    Task InsertChatMedia(ChatMedia chatMedia);
    Task<ChatMedia> GetChatMedia(string id);
    Task<ChatMedia> CloneChatMedia(string id, Guid from_id, Guid to_id);
    Task CreateIndexes();
}

public class MongoService : IMongoService
{
    private readonly IMongoCollection<ChatMessage> _chatMessageCollection;
    private readonly IMongoCollection<ChatMedia> _chatMediaCollection;
    private readonly IMapper _mapper;

    public MongoService(
        IOptions<CollabCommMongoSettings> collabCommMongoSettings,
        IMapper mapper)
    {
        _mapper = mapper;
        var mongoClient = new MongoClient(
            collabCommMongoSettings.Value.ConnectionString);

        var mongoDatabase = mongoClient.GetDatabase(
            collabCommMongoSettings.Value.DatabaseName);

        _chatMessageCollection = mongoDatabase.GetCollection<ChatMessage>("ChatMessage");
        _chatMediaCollection = mongoDatabase.GetCollection<ChatMedia>("ChatMedia");
    }

    public async Task CreateIndexes()
    {
        var chatMessageIndexKeys = Builders<ChatMessage>.IndexKeys
            .Ascending(doc => doc.deleted)
            .Ascending(doc => doc.is_group)
            .Ascending(doc => doc.from_id);
        await _chatMessageCollection.Indexes.CreateOneAsync(chatMessageIndexKeys);
    }
    public async Task InsertChatMedia(ChatMedia chatMedia)
    {
        await _chatMediaCollection.InsertOneAsync(chatMedia);
    }

    public async Task<ChatMedia> CloneChatMedia(string id, Guid from_id, Guid to_id)
    {
        var media = await _chatMediaCollection.Find(x => x.id == id).FirstOrDefaultAsync();
        media.id = null;
        media.from_id = from_id;
        media.to_id = to_id;
        await _chatMediaCollection.InsertOneAsync(media);
        return media;
    }

    public async Task<ChatMedia> GetChatMedia(string id)
    {
        return await _chatMediaCollection.Find(x => x.id == id).FirstOrDefaultAsync();
    }

    public async Task<List<ChatMessageInfo>> GetMessagesByIds(Guid user_id, List<Guid> gps, List<string> ids,
        CancellationToken cancellationToken)
    {
        var msgs = await _chatMessageCollection
            .Find(x => (ids.Contains(x.id) && ((x.is_group && gps.Contains(x.from_id)) ||
                                               (!x.is_group && x.from_id == user_id))) &&
                       x.deleted == false).ToListAsync(cancellationToken);
        return _mapper.Map<List<ChatMessageInfo>>(msgs);
    }

    public async Task<ChatMessageInfo> GetMessageById(string id, CancellationToken cancellationToken)
    {
        var msg = await _chatMessageCollection
            .Find(x => x.id == id).SingleOrDefaultAsync(cancellationToken);
        return _mapper.Map<ChatMessageInfo>(msg);
    }

    public async Task DeleteMessage(Guid from_id, Guid to_id, string id, CancellationToken cancellationToken)
    {
        var builder = Builders<ChatMessage>.Update;
        await _chatMessageCollection.UpdateOneAsync(s => s.id == id && (s.from_id == from_id || s.to_id == to_id),
            builder.Set(x => x.deleted, true), cancellationToken: cancellationToken);
    }

    public async Task<ChatMessageInfo> GetMessageByPairId(bool isGroup, Guid fromId, string id,
        CancellationToken cancellationToken)
    {
        var msg = await _chatMessageCollection
            .Find(x => x.deleted == false && x.is_group == isGroup && x.from_id == fromId && x.pair_id == id)
            .SingleOrDefaultAsync(cancellationToken);

        return _mapper.Map<ChatMessageInfo>(msg);
    }


    public async Task<List<ChatMessageInfo>> GetMessagesByFromIdAndToId(bool isGroup, Guid from_id, Guid to_id,
        long? counter, bool isPrevious, int limit, CancellationToken cancellationToken)
    {
        var x = _chatMessageCollection
            .Find(x => x.deleted == false && x.is_group == isGroup && x.from_id == from_id && x.to_id == to_id &&
                       (counter == null || (isPrevious && x.conversation_counter < counter) ||
                        (!isPrevious && x.conversation_counter > counter)));
        if (isPrevious)
            x = x.SortByDescending(s => s.conversation_counter);
        if (!isPrevious)
            x = x.SortBy(s => s.conversation_counter);
        var msgs = await x.Limit(limit).ToListAsync(cancellationToken);
        return _mapper.Map<List<ChatMessageInfo>>(msgs);
    }

    public async Task<ChatMessageInfo> GetOneMessageByFromIdAndToId(bool isGroup, Guid from_id, Guid to_id,
        CancellationToken cancellationToken)
    {
        var msg = await _chatMessageCollection
            .Find(x => x.deleted == false && x.is_group == isGroup && (x.from_id == from_id && x.to_id == to_id))
            .SortByDescending(s => s.conversation_counter).Limit(1).SingleOrDefaultAsync(cancellationToken);

        return _mapper.Map<ChatMessageInfo>(msg);
    }

    public async Task<List<ChatMessageInfo>> GetMessagesByFromId(bool isGroup, Guid from_id, long? counter,
        bool isPrevious,
        int limit, CancellationToken cancellationToken)
    {
        var x = _chatMessageCollection
            .Find(x => x.deleted == false && x.is_group == isGroup && x.from_id == from_id &&
                       (counter == null || (isPrevious && x.conversation_counter < counter) ||
                        (!isPrevious && x.conversation_counter > counter)));
        if (isPrevious)
            x = x.SortByDescending(s => s.conversation_counter);
        if (!isPrevious)
            x = x.SortBy(s => s.conversation_counter);

        var msgs = await x.Limit(limit).ToListAsync(cancellationToken);
        return _mapper.Map<List<ChatMessageInfo>>(msgs);
    }

    public async Task<ChatMessageInfo> GetOneMessageByFromId(bool isGroup, Guid from_id,
        CancellationToken cancellationToken)
    {
        var msg = await _chatMessageCollection
            .Find(x => x.deleted == false && x.is_group == isGroup && (x.from_id == from_id))
            .SortByDescending(s => s.conversation_counter).Limit(1)
            .SingleOrDefaultAsync(cancellationToken);
        return _mapper.Map<ChatMessageInfo>(msg);
    }

    public async Task CreateMessage(ChatMessage message) =>
        await _chatMessageCollection.InsertOneAsync(message);
}