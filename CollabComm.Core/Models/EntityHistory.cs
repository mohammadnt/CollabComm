namespace CollabComm.Core.Models;

public class EntityHistory<TUserKey, TEntityKey>
    where TUserKey : IEquatable<TUserKey>
    where TEntityKey : IEquatable<TEntityKey>
{
    public TEntityKey Id { get; set; }
    public TEntityKey EntityId { get; set; }
    public TUserKey UserId { get; set; }
    public DateTime DateTime { get; set; }
    public string EntityType { get; set; }
    public string Action { get; set; }
    public string Message { get; set; }
}

public class EntityHistory : EntityHistory<int, int>
{
}