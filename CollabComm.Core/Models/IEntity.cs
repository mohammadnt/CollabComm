namespace CollabComm.Core.Models;

public interface IEntity<TKey> where TKey : IEquatable<TKey>
{
    TKey id { get; set; }
}
public interface IEntity : IEntity<Guid>
{
}