namespace CollabComm.Models;

public class PublicUserMediaInfo
{
    public Guid id { get; set; }
    public Guid user_id { get; set; }
    public int type { get; set; }   
    public string mime_type { get; set; }   
    public string path { get; set; }
}