
namespace CollabComm.Models;

public class ChatMessageInfo
{
    public string? id { get; set; }
    public Guid from_id { get; set; }
    public Guid to_id { get; set; }
    public long conversation_counter { get; set; }
    public DateTime creation_date { get; set; }
    public string data { get; set; }
    public bool? deleted { get; set; }
    public string? forward_id { get; set; }
    public Guid? forward_user_id { get; set; }
    public bool is_delivered { get; set; }
    public bool is_read { get; set; }
    public string? media_id { get; set; }
    public string media_path { get; set; }
    public string text { get; set; }
    public int type { get; set; }
    public Guid? original_from_id { get; set; }
    public Guid? original_to_id { get; set; }
    public DateTime? read_date { get; set; }
    public string reply_id { get; set; }
    public long user_counter { get; set; }
    public bool is_group { get; set; }
    public bool is_sender { get; set; }
    public string? pair_id { get; set; }
}