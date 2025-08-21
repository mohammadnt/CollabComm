using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using CollabComm.Core.Models;

namespace CollabComm.InterComm.Models;

public class Conversation : IEntity<Guid>
{
    public Guid id { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime? creation_date { get; set; } = DateTime.UtcNow;

    public Guid from_id { get; set; }
    public Guid to_id { get; set; }
    public int unread_count { get; set; }
    public long last_message_counter { get; set; }
    public string? last_message_id { get; set; }
    public DateTime? last_message_date { get; set; }
    public int pin { get; set; }
    public bool mute { get; set; }
    public bool block { get; set; }
    public bool favorite { get; set; }
    public Guid? last_seen_id { get; set; }
    public long last_seen_counter { get; set; }
    public long pin_message_id { get; set; }
    public long last_read_counter { get; set; }
    public string? first_message_id { get; set; }
    public bool deleted { get; set; }
    

    public static Conversation Generate(Guid fromId, Guid toId)
    {
        return new Conversation()
        {
            unread_count = 0,
            last_message_counter = 0,
            from_id = fromId,
            to_id = toId
        };
    }
}