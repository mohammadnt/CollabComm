using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using CollabComm.Core.Models;

namespace CollabComm.InterComm.Models;

public class UserGroup : IEntity<Guid>
{
    public Guid id { get; set; }
    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime? creation_date { get; set; } = DateTime.UtcNow;
    public Guid? user_id { get; set; }
    public Guid group_id { get; set; }
    public bool is_owner { get; set; }
    public bool is_admin { get; set; }
    public Guid? last_seen_id { get; set; }
    public long last_seen_counter { get; set; }
    public List<Guid>? creator_userids { get; set; }
    public bool deleted { get; set; }
    public bool pin { get; set; }
    public bool mute { get; set; }
    public bool favorite { get; set; }
    public Guid? first_message_id { get; set; }
    

    public static UserGroup Generate(Guid groupId, Guid userId, bool isOwner, bool isAdmin)
    {
        return new UserGroup()
        {
            user_id = userId,
            group_id = groupId,
            is_owner = isOwner,
            is_admin = isAdmin
        };
    }
    public static UserGroup GenerateForAdmin(Guid groupId, Guid userId, bool isOwner, bool isAdmin)
    {
        return new UserGroup()
        {
            user_id = userId, 
            group_id = groupId, 
            is_owner = isOwner, 
            is_admin = isAdmin
        };
    }

}