
using CollabComm.Core.Models;

namespace CollabComm.InterComm.Models;

public class PublicUserMedia : IEntity<Guid>
{
    public Guid id { get; set; }
    public Guid user_id { get; set; }
    public int? type { get; set; }
    public string mime_type { get; set; }
    public string path { get; set; }
    public static PublicUserMedia Generate(Guid user_id, int type, string mimeType, string path)
    {
        return new PublicUserMedia()
        {
            user_id = user_id, type = type, mime_type = mimeType, path = path
        };
    }
}