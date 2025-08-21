namespace CollabComm.DTO;

public class UserDataRequestDTO
{
    public string? user_agent { get; set; }
    public string? app_version { get; set; }
    public int? build_number { get; set; }
    public int? store_id { get; set; }
    public Guid? ewano_session_id { get; set; }
    public string? device_id { get; set; }
    public bool? is_from_web { get; set; }
}
