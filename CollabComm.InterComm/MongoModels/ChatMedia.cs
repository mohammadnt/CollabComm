using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CollabComm.InterComm.MongoModels;

public class ChatMedia
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? id { get; set; }
    public Guid from_id { get; set; }
    public Guid to_id { get; set; }
    public int type { get; set; }
    public string mime_type { get; set; }
    public string path { get; set; }


    public static ChatMedia Generate(Guid from_id, Guid to_id, int type, string mimeType, string path)
    {
        return new ChatMedia()
        {
            from_id = from_id, to_id = to_id, type = type, mime_type = mimeType, path = path
        };
    }
}