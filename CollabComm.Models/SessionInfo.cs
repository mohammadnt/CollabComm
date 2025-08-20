namespace CollabComm.Models;

public class SessionInfo
{
    public Guid id { get; set; }
    public Guid user_id { get; set; }
    public int client_type { get; set; }
    public string user_agent { get; set; }
    public string subscription { get; set; }
    public string? device_id { get; set; }
    public bool deleted { get; set; }
    public DateTime? last_online_date { get; set; }
    public string? app_version { get; set; }
    public int? store_id { get; set; }

}