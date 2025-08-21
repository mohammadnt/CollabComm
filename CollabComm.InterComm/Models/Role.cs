using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;
using CollabComm.Core.Models;

namespace CollabComm.InterComm.Models;

public class Role : IEntity<Guid>
{
    public Guid id { get; set; }
    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime? creation_date { get; set; } = DateTime.UtcNow;
    public string title { get; set; }
}
    