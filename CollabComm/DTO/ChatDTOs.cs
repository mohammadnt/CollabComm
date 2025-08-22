using CollabComm.Core.Models;

namespace CollabComm.DTO;

public class GetUserRequestDTO 
{
    public List<Guid> user_ids { get; set; }
}
public class GetMessagesByIdsRequestDTO 
{
    public List<string> ids { get; set; }
}
public class GetMessagesByCounterRequestDTO 
{
    public Guid user_id { get; set; }
    public int? counter { get; set; }
    public string? reply_id { get; set; }
    public bool is_previous { get; set; } = true;
}
public class AddToGroupRequestDTO 
{
    public Guid group_id { get; set; }
    public List<Guid> user_ids { get; set; }
}
public class SeenRequestDTO 
{
    public Guid user_id { get; set; }
    public long counter { get; set; }
    public string? id { get; set; }
}

public class CreateGroupRequestDTO
{
    public string username { get; set; }
    public string title { get; set; }
    public List<Guid> user_ids { get; set; }
}

public class AddMembersRequestDTO
{
    public Guid group_id { get; set; }
    public List<Guid> user_ids { get; set; }
}

public class AddChatMediaRequestDTO
{
    public int type { get; set; }
    public Guid user_id { get; set; }

    public string MimeType
    {
        get
        {
            switch ((MediaType)type)
            {
                case MediaType.Audio:
                    return "audio/mpeg";
                case MediaType.Image:
                    return "image/png";
                case MediaType.Video:
                    return "video/webm;codecs=\"vp8\"";
                case MediaType.Vtt:
                    return "text/vtt";
                case MediaType.File:
                    return "application/octet-stream";
                case MediaType.AudioAAC:
                    return "audio/mp4";
            }

            return "application/octet-stream";
        }
    }
}