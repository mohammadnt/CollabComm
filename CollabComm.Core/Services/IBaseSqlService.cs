using CollabComm.Core.Models;

namespace CollabComm.Core.Services;

public interface IBaseSqlService<TKey> where TKey : IEquatable<TKey>
{
    Task<TEntity> Insert<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<bool> Update<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<bool> Delete<TEntity>(TKey id, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<IEnumerable<TEntity>> GetAll<TEntity>(CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<TEntity> GetById<TEntity>(TKey id, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<IEnumerable<TEntity>> GetByIds<TEntity>(IEnumerable<TKey> ids, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<int> SaveChanges(CancellationToken cancellationToken = default);
}

public interface IBaseSqlService : IBaseSqlService<Guid>
{
}