namespace CollabComm.Models;

public class CollabUserInfo
{
    public Guid id { get; set; }
    public DateTime creation_date { get; set; }
    public string? first_name { get; set; }
    public string? last_name { get; set; }
   

    // public string password { get; set; }
    public string username { get; set; }
    public int type { get; set; }
    public int last_message_counter { get; set; }
    
    public Guid? media_id { get; set; }
    // public string full_name => $"{first_name} {last_name}";

}