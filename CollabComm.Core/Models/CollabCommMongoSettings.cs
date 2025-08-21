namespace CollabComm.Core.Models;

public class CollabCommMongoSettings
{
    public string ConnectionString { get; set; } = null!;

    public string DatabaseName { get; set; } = null!;
    public string MessageCollectionName { get; set; } = null!;

}