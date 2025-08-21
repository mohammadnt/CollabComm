using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using CollabComm.Core.Models;

namespace CollabComm.InterComm.MongoModels;

public class ChatMessage
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? id { get; set; }
    public Guid from_id { get; set; }
    public Guid to_id { get; set; }
    public long conversation_counter { get; set; }
    public DateTime creation_date { get; set; }
    public string data { get; set; }
    public bool? deleted { get; set; }
    public string? forward_id { get; set; }
    public Guid? forward_user_id { get; set; }
    public bool is_delivered { get; set; }
    public bool is_read { get; set; }
    public string? media_id { get; set; }
    public string media_path { get; set; }
    public string text { get; set; }
    public int type { get; set; }
    public Guid? original_from_id { get; set; }
    public Guid? original_to_id { get; set; }
    public DateTime? read_date { get; set; }
    public string reply_id { get; set; }
    public long user_counter { get; set; }
    public bool is_group { get; set; }
    public bool is_sender { get; set; }
    public string? pair_id { get; set; }

    public static ChatMessage Generate(Guid fromId, Guid toId, string text, bool isSender, MessageType type,
        string data, string? mediaId, string mediaPath, long user_counter, bool isGroup,long conversationCounter,string replyId,
        string forwardId , Guid? forwardUserId)
    {
        return new ChatMessage()
        {
            creation_date = DateTime.UtcNow,
            from_id = fromId,
            to_id = toId,
            text = text,
            is_sender = isSender,
            type = (int)type,
            data = data,
            media_id = mediaId,
            media_path = mediaPath,
            user_counter = user_counter,
            is_group = isGroup,
            conversation_counter = conversationCounter,
            reply_id = replyId,
            forward_id = forwardId,
            forward_user_id = forwardUserId
        };
    }
}