using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;

namespace CollabComm.Models;

public class ConversationInfo
{
    public Guid id { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime? creation_date { get; set; }

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
    public int last_read_counter { get; set; }
    public string? first_message_id { get; set; }
    public bool deleted { get; set; }

    public UserGroupInfo user_group { get; set; }
    public ConversationInfo SetUserGroup(UserGroupInfo userGroup)
    {
        this.user_group = userGroup;
        return this;
    }
}