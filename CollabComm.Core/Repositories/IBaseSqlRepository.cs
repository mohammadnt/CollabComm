using CollabComm.Core.Models;
using System.Linq.Expressions;

namespace CollabComm.Core.Repositories;

public interface IBaseSqlRepository<TKey> where TKey : IEquatable<TKey>
{
    Task<TEntity> Insert<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<bool> InsertMany<TEntity>(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<bool> Detach<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<bool> Update<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<bool> Delete<TEntity>(TKey id, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<bool> DeleteByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>;

    Task<bool> DeleteMany<TEntity>(IEnumerable<TKey> ids, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;

    Task<IEnumerable<TEntity>> GetAll<TEntity>(CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;
    Task<IEnumerable<TEntity>> GetAllByInclude<TEntity>(Expression<Func<TEntity, object>> include, Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>;

    Task<TEntity> GetById<TEntity>(TKey id, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>;
    Task<TEntity> GetByInclude<TEntity>(TKey id, Expression<Func<TEntity, object>> include, CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>;
    Task<IQueryable<TEntity>> GetByInclude<TEntity>(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, object>> include, CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>;

    Task<IEnumerable<TEntity>> GetByIds<TEntity>(IEnumerable<TKey> ids,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>;

    Task<int> SaveChanges(CancellationToken cancellationToken = default);
    IEnumerable<TEntity> RunQuery<TEntity>(string q) where TEntity : class, IEntity<TKey>;
    Task<IEnumerable<TEntity>> GetFromQueryAsync<TEntity>(string q, params object[] parameters) where TEntity : class, IEntity<TKey>;
    Task<int> RunQueryAsync(string q, params object[] parameter);
    Task<IEnumerable<TEntity>> RunQueryAsync<TEntity>(string q) where TEntity : class, IEntity<TKey>;
    Task<IEnumerable<TEntity>> RunQueryByInclude<TEntity>(string q, Expression<Func<TEntity, object>> include) where TEntity : class, IEntity<TKey>;
    Task<TEntity> GetOneByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>;
    Task<IQueryable<TEntity>> GetByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>;
    Task<bool> UpdateByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, object>> updateExpression, CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>;
}

public interface IBaseSqlRepository : IBaseSqlRepository<Guid>
{
}