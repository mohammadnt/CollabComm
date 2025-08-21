using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using CollabComm.Core.Models;

namespace CollabComm.InterComm.Models;

public class Error : IEntity<Guid>
{
    public Guid id { get; set; }
    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime? creation_date { get; set; } = DateTime.UtcNow;
    public string? data { get; set; }
    public string? error { get; set; }
    public string? stack_trace { get; set; }
    public Guid? user_id { get; set; }

    public Guid? connection_id { get; set; }

    public int? platform { get; set; }
    public string? app_version { get; set; }

    public static Error Generate(Guid? userId, string data, string error, string stackTrace, Guid? connectionId,
        int? platform, string app_version)
    {
        return new Error()
        {
            user_id = userId, data = data, error = error, stack_trace = stackTrace, connection_id = connectionId,
            platform = platform, app_version = app_version
        };
    }
}