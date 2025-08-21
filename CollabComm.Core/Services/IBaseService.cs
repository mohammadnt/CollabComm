using CollabComm.Core.Models;

namespace CollabComm.Core.Services;

public interface IBaseService<TKey, TEntity>
    where TEntity : class, IEntity<TKey>
    where TKey : IEquatable<TKey>
{
    Task<bool> Add(TEntity entity, CancellationToken cancellationToken = default);
    Task<bool> Update(TEntity entity, CancellationToken cancellationToken = default);
    Task<bool> Delete(TKey id, CancellationToken cancellationToken = default);
    Task<List<TEntity>> GetAll(CancellationToken cancellationToken = default);
    Task<TEntity> GetById(TKey id, CancellationToken cancellationToken = default);
    Task<List<TEntity>> GetByIds(IEnumerable<TKey> ids, CancellationToken cancellationToken = default);
}