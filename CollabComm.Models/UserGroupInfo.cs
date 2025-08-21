namespace CollabComm.Models;

public class UserGroupInfo
{
    public Guid id { get; set; }
    public DateTime? creation_date { get; set; }
    public Guid user_id { get; set; }
    public Guid group_id { get; set; }
    public bool? is_owner { get; set; }
    public bool? is_admin { get; set; }
    public Guid last_seen_id { get; set; }
    public long? last_seen_counter { get; set; }
    public List<Guid>? creator_userids { get; set; }
    public bool? deleted { get; set; }
    public bool? pin { get; set; }
    public bool? mute { get; set; }
    public bool? favorite { get; set; }
    public Guid? first_message_id { get; set; }  
    public int? term_number { get; set; }
    public string? term_code { get; set; }
    
    public CollabUserInfo user { get; set; }
    public List<SessionInfo> sessions { get; set; }

    public UserGroupInfo SetUser(CollabUserInfo user)
    {
        this.user = user;
        return this;
    }

    public UserGroupInfo SetSessions(List<SessionInfo> sessions)
    {
        this.sessions = sessions;
        return this;
    }
}