using System.Linq.Expressions;
using CollabComm.Core.Models;
using CollabComm.Core.Repositories;

namespace CollabComm.Core.Services;

public abstract class BaseSqlService<TKey> : IBaseSqlService<TKey> where TKey : IEquatable<TKey>
{
    protected readonly IBaseSqlRepository<TKey> Repository;

    public BaseSqlService(IBaseSqlRepository<TKey> repository)
    {
        Repository = repository;
    }

    public virtual async Task<TEntity> Insert<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.Insert(entity, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return entity;
    }

    public virtual async Task<bool> InsertMany<TEntity>(IEnumerable<TEntity> entities,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.InsertMany(entities, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<bool> Detach<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.Detach(entity, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<bool> Update<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.Update(entity, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<bool> Delete<TEntity>(TKey id, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.Delete<TEntity>(id, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<bool> DeleteByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.DeleteByFilter(predicate, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<bool> DeleteMany<TEntity>(IEnumerable<TKey> ids,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        await Repository.DeleteMany<TEntity>(ids, cancellationToken);
        var result = (await Repository.SaveChanges(cancellationToken)) > 0;
        return result;
    }

    public virtual async Task<IEnumerable<TEntity>> GetAll<TEntity>(CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await Repository.GetAll<TEntity>(cancellationToken);
    }

    public virtual async Task<TEntity> GetById<TEntity>(TKey id, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await Repository.GetById<TEntity>(id, cancellationToken);
    }

    public virtual async Task<IEnumerable<TEntity>> GetByIds<TEntity>(IEnumerable<TKey> ids,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await Repository.GetByIds<TEntity>(ids, cancellationToken);
    }

    public virtual IEnumerable<TEntity> RunQuery<TEntity>(string q) where TEntity : class, IEntity<TKey>
    {
        return Repository.RunQuery<TEntity>(q);
    }

    public virtual async Task<IEnumerable<TEntity>> GetFromQueryAsync<TEntity>(string q, params object[] parameters)
        where TEntity : class, IEntity<TKey>
    {
        return await Repository.GetFromQueryAsync<TEntity>(q, parameters);
    }

    public virtual async Task<int> RunQueryAsync(string q, params object[] parameter)
    {
        return await Repository.RunQueryAsync(q, parameter);
    }

    public async Task<int> SaveChanges(CancellationToken cancellationToken = default)
    {
        return await Repository.SaveChanges(cancellationToken);
    }
}

public abstract class BaseSqlService : BaseSqlService<Guid>
{
    public BaseSqlService(IBaseSqlRepository repository) : base(repository)
    {
    }
}