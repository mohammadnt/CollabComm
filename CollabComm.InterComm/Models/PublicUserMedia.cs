
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using CollabComm.Core.Models;

namespace CollabComm.InterComm.Models;

public class PublicUserMedia : IEntity<Guid>
{
    public Guid id { get; set; }
    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime? creation_date { get; set; } = DateTime.UtcNow;
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