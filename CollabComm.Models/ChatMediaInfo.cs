namespace CollabComm.Models;

public class ChatMediaInfo
{
    public string id { get; set; }
    public Guid from_id { get; set; }
    public Guid to_id { get; set; }
    public int type { get; set; }   
    public string mime_type { get; set; }   
    public string path { get; set; }
}