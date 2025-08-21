using CollabComm.Core.Models;
using CollabComm.Core.Services;
using System.Linq.Expressions;

namespace CollabComm.InterComm.Repositories;

public interface ISqlRepository : IBaseRepository
{
}

public class SqlRepository : BaseSqlService, ISqlRepository
{
    private readonly IBaseRepository _repository;

    public SqlRepository(IBaseRepository repository) : base(repository)
    {
        _repository = repository;
    }

    public async Task<T> GetOneByFilter<T>(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) where T : class, IEntity<Guid>
    {
        return await _repository.GetOneByFilter(predicate, cancellationToken);
    }

    public async Task<IQueryable<T>> GetByFilter<T>(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) where T : class, IEntity<Guid>
    {
        return await _repository.GetByFilter(predicate, cancellationToken);
    }

    public async Task<bool> UpdateByFilter<T>(Expression<Func<T, bool>> predicate, Expression<Func<T, object>> updateExpression, CancellationToken cancellationToken = default) where T : class, IEntity<Guid>
    {
        return await _repository.UpdateByFilter(predicate, updateExpression, cancellationToken);
    }

    public async Task<IEnumerable<TEntity>> GetAllByInclude<TEntity>(Expression<Func<TEntity, object>> include, Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken) where TEntity : class, IEntity<Guid>
    {
        return await _repository.GetAllByInclude(include, predicate, cancellationToken);
    }

    public async Task<TEntity> GetByInclude<TEntity>(Guid id, Expression<Func<TEntity, object>> include, CancellationToken cancellationToken) where TEntity : class, IEntity<Guid>
    {
        return await _repository.GetByInclude(id, include, cancellationToken);
    }

    public async Task<IQueryable<TEntity>> GetByInclude<TEntity>(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, object>> include, CancellationToken cancellationToken) where TEntity : class, IEntity<Guid>
    {
        return await _repository.GetByInclude(predicate, include, cancellationToken);
    }

    public async Task<IEnumerable<TEntity>> RunQueryAsync<TEntity>(string q) where TEntity : class, IEntity<Guid>
    {
        return await _repository.RunQueryAsync<TEntity>(q);
    }

    public async Task<IEnumerable<TEntity>> RunQueryByInclude<TEntity>(string q, Expression<Func<TEntity, object>> include) where TEntity : class, IEntity<Guid>
    {
        return await _repository.RunQueryByInclude(q, include);
    }
    ////////////////////////

}