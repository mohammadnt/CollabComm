using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;

namespace CollabComm.Models;

public class ContactInfo
{
    public Guid id { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Identity), DataMember]
    public DateTime? creation_date { get; set; }

    public string title { get; set; }
    public Guid user_id { get; set; }
    public Guid target_id { get; set; }
    public string username { get; set; }
    public bool deleted { get; set; }
    
    public CollabUserInfo user { get; set; }

    public ContactInfo SetUser(CollabUserInfo user)
    {
        this.user = user;
        return this;
    }
}