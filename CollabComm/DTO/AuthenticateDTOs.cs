namespace CollabComm.DTO;

public class LoginRequestDTO
{
    public string username { get; set; }
    public string password { get; set; }
    public string? device_id { get; set; }
    public int client_type { get; set; }
    public string user_agent { get; set; }
    public string? app_version { get; set; }
    public int? store_id { get; set; }
}
public class RegisterRequestDTO
{
    public string first_name { get; set; }
    public string last_name { get; set; }
    public string username { get; set; }
    public string password { get; set; }
    public string? device_id { get; set; }
    public int client_type { get; set; }
    public string user_agent { get; set; }
    public string? app_version { get; set; }
    public int? store_id { get; set; }
}