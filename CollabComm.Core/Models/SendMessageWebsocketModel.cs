namespace CollabComm.Core.Models;

public enum MessageType
{
    text = 1,
    voice = 2,
    system_message = 3,
    file = 4,
    image = 5,
    voice_ogg = 6,
}

public enum SystemMessageType
{
    create_group = 1
}

public class SendMessageWebsocketModel
{
    public MessageType type { get; set; }
    public string? file_id { get; set; }
    public string? reply_id { get; set; }
    public string? forward_message_id { get; set; }
    public Guid? forward_conversation_id { get; set; }
    public string? client_id { get; set; }
    public Guid to_id { get; set; }
    public string? data { get; set; }
    public string text { get; set; }
    public bool? is_link { get; set; }
    public bool? advanced_forward { get; set; }
};