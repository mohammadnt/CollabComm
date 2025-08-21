

using CollabComm.Core.Models;

namespace CollabComm.DTO;

public class AddMediaRequestDTO
{
    public int type { get; set; }


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
            }

            return "application/octet-stream";
        }
    }
}