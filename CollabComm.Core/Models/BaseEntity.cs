namespace CollabComm.Core.Models;

public class BaseEntity<TKey> : IEntity<TKey> where TKey : IEquatable<TKey>
{
    public TKey id { get; set; }
}
public class BaseEntity : BaseEntity<Guid>, IEntity
{
}