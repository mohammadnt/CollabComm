using Newtonsoft.Json;

namespace CollabComm.Core.Models;

public class WebsocketModel
{
    public WebsocketModel()
    {
            
    }
    public WebsocketModel(MethodCode method,object data , string identifier = null)
    {
        this.method = method;
        this.data = JsonConvert.SerializeObject(data);
        this.identifier = identifier;
    }
    public WebsocketModel(int code,object data , string identifier = null)
    {
        this.method = (MethodCode)code;
        this.data = JsonConvert.SerializeObject(data);
        this.identifier = identifier;
    }
    public MethodCode method { get; set; } 
    public string data { get; set; }
    public string identifier { get; set; }
}

public class SyncModel
{
    public Guid from_id { get; set; }
    public Guid to_id { get; set; }
    public int method { get; set; }
    public string value { get; set; }

    public SyncModel(Guid fromId ,Guid toId,SyncMethod method,string value)
    {
        this.from_id = fromId;
        this.to_id = toId;
        this.method = (int)method;
        this.value = value;
    }
    public SyncModel(Guid fromId ,Guid toId,SyncMethod method,object value)
    {
        this.from_id = fromId;
        this.to_id = toId;
        this.method = (int)method;
        this.value = JsonConvert.SerializeObject(value);
    }
}
    
public class SeenModel
{
    public string seen_id { get; set; }
    public long seen_counter { get; set; }

    public SeenModel(string seenId , long seenCounter)
    {
        this.seen_id = seenId;
        this.seen_counter = seenCounter;
    }
}
public class DeleteMessageModel
{
    public string message_id { get; set; }

    public DeleteMessageModel(string message_id)
    {
        this.message_id = message_id;
    }
}