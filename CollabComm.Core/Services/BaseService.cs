using CollabComm.Core.Models;
using CollabComm.Core.Repositories;

namespace CollabComm.Core.Services;

public abstract class BaseService<TKey, TEntity> : IBaseService<TKey, TEntity>
    where TEntity : class, IEntity<TKey>
    where TKey : IEquatable<TKey>
{
    protected readonly IBaseRepository<TKey, TEntity> Repository;

    public BaseService(IBaseRepository<TKey, TEntity> repository)
    {
        Repository = repository;
    }

    public virtual async Task<bool> Add(TEntity entity, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.Insert(entity, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<bool> Update(TEntity entity, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.Update(entity, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<bool> Delete(TKey id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.Delete(id, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<List<TEntity>> GetAll(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return (await Repository.GetAll(cancellationToken)).ToList();
    }

    public virtual async Task<TEntity> GetById(TKey id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await Repository.GetById(id, cancellationToken);
    }

    public virtual async Task<List<TEntity>> GetByIds(IEnumerable<TKey> ids,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return (await Repository.GetByIds(ids, cancellationToken)).ToList();
    }
}