using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using CollabComm.Core.Models;

namespace CollabComm.InterComm.Models;

public class CollabUser : IEntity<Guid>
{
    public Guid id { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime creation_date { get; set; } = DateTime.UtcNow;

    public string? first_name { get; set; }

    public string? last_name { get; set; }

    public string? password { get; set; }
    public string username { get; set; }
    public int type { get; set; }
    public long last_message_counter { get; set; }
    public bool deleted { get; set; }

    public Guid? media_id { get; set; }
    

}