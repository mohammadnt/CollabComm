using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using CollabComm.Core.Models;

namespace CollabComm.InterComm.Models;

public class Session : IEntity<Guid>
{
    public Guid id { get; set; }   
    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime? creation_date { get; set; } = DateTime.UtcNow;
    public Guid user_id { get; set; }
    public int client_type { get; set; }
    public string? user_agent { get; set; }
    public string? subscription { get; set; }
    public string? device_id { get; set; }
    public bool deleted { get; set; }
    public DateTime? last_online_date { get; set; }
    public string? app_version { get; set; }
    public int? build_number { get; set; }
    public int? store_id { get; set; }
    public int cache_cleared { get; set; }




    public static Session Generate(Guid user_id, string user_agent, int client_type, string device_id,
        string app_version, int? store_id, int cacheCleared)
    {
        return new Session()
        {
            user_id = user_id,
            client_type = client_type,
            user_agent = user_agent,
            device_id = device_id,
            last_online_date = DateTime.UtcNow,
            store_id = store_id,
            app_version = app_version,
            cache_cleared = cacheCleared
        };
    }
}