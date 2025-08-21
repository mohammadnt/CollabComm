using CollabComm.Core.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CollabComm.Core.Repositories;

public abstract class BaseSqlRepository<TKey> : IBaseSqlRepository<TKey> where TKey : IEquatable<TKey>
{
    public DbContext Context { get; set; }

    public BaseSqlRepository(DbContext context)
    {
        Context = context;
    }

    public virtual async Task<int> SaveChanges(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await Context.SaveChangesAsync();
    }

    public virtual async Task<bool> Delete<TEntity>(TKey id, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        var Entity = Context.Set<TEntity>();
        cancellationToken.ThrowIfCancellationRequested();
        var entity = await Entity.SingleOrDefaultAsync(s => s.id.Equals(id));
        if (entity != null) Entity.Remove(entity);
        return true;
    }

    public virtual async Task<bool> DeleteByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        var Entity = Context.Set<TEntity>();
        cancellationToken.ThrowIfCancellationRequested();
        /*var entity = await Entity.SingleOrDefaultAsync(predicate);
        if (entity != null) Entity.Remove(entity);*/
        var entities = Entity.Where(predicate);
        if ((entities?.Count() ?? 0) > 0) Entity.RemoveRange(entities);
        return await Task.FromResult(true);
    }

    public virtual async Task<bool> DeleteMany<TEntity>(IEnumerable<TKey> ids,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        var Entity = Context.Set<TEntity>();
        cancellationToken.ThrowIfCancellationRequested();
        var entities = await Entity.Where(s => ids.Contains(s.id)).ToListAsync();
        Entity.RemoveRange(entities);
        return true;
    }

    public virtual async Task<IEnumerable<TEntity>> GetAll<TEntity>(CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await Query<TEntity>();
    }
    public virtual async Task<IEnumerable<TEntity>> GetAllByInclude<TEntity>(Expression<Func<TEntity, object>> include,
        Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await QueryByInclude(predicate, include, cancellationToken);
    }

    public virtual async Task<TEntity> GetById<TEntity>(TKey id, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await (await Query<TEntity>(s => s.id.Equals(id), cancellationToken)).SingleOrDefaultAsync();
    }
    public virtual async Task<TEntity> GetByInclude<TEntity>(TKey id, Expression<Func<TEntity, object>> include, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await (await QueryByInclude(s => s.id.Equals(id), include, cancellationToken)).SingleOrDefaultAsync(cancellationToken: cancellationToken);
    }
    public virtual async Task<IQueryable<TEntity>> GetByInclude<TEntity>(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, object>> include, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await QueryByInclude(predicate, include, cancellationToken);
    }

    public virtual async Task<IEnumerable<TEntity>> GetByIds<TEntity>(IEnumerable<TKey> ids,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await Query<TEntity>(s => ids.Contains(s.id));
    }

    public virtual async Task<TEntity> Insert<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        var Entity = Context.Set<TEntity>();
        cancellationToken.ThrowIfCancellationRequested();
        await Entity.AddAsync(entity);
        return entity;
    }

    public virtual async Task<bool> InsertMany<TEntity>(IEnumerable<TEntity> entities,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        await Context.AddRangeAsync(entities, cancellationToken);
        return true;
    }

    public virtual async Task<bool> Detach<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        Context.Entry(entity).State = EntityState.Detached;
        return await Task.FromResult(true);
    }

    public virtual async Task<bool> Update<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        cancellationToken.ThrowIfCancellationRequested();
        //Context.ChangeTracker.Clear();
        await Task.Run(() => Context.Entry(entity).State = EntityState.Modified);
        return true;
    }

    protected virtual async Task<bool> BulkUpdate<TEntity>(Expression<Func<TEntity, bool>> predicate,
        Expression<Func<TEntity, object>> updateExpression,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        var Entity = Context.Set<TEntity>();
        cancellationToken.ThrowIfCancellationRequested();
        var flag = await Entity.AsNoTracking().Where(predicate).UpdateFromQueryAsync(updateExpression, cancellationToken) > 0;
        return await Task.FromResult(flag);
    }

    public virtual async Task<int> ExecuteSqlCommand(string command, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await Context.Database.ExecuteSqlRawAsync(command, cancellationToken);
    }

    protected virtual async Task<IQueryable<TEntity>> Query<TEntity>(Expression<Func<TEntity, bool>> predicate,
        CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        var Entity = Context.Set<TEntity>();
        cancellationToken.ThrowIfCancellationRequested();
        return await Task.Run(() => Entity.AsNoTracking().Where(predicate));
    }

    protected virtual async Task<IQueryable<TEntity>> Query<TEntity>(CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        var Entity = Context.Set<TEntity>();
        cancellationToken.ThrowIfCancellationRequested();
        return await Task.Run(() => Entity.AsNoTracking());
    }
    protected virtual async Task<IQueryable<TEntity>> QueryByInclude<TEntity>(Expression<Func<TEntity, bool>> predicate,
        Expression<Func<TEntity, object>> include, CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        var Entity = Context.Set<TEntity>();
        cancellationToken.ThrowIfCancellationRequested();
        var query = await Task.Run(() => Entity.AsNoTracking().Where(predicate).Include(include));
        return query;
    }
    public virtual IEnumerable<TEntity> RunQuery<TEntity>(string q) where TEntity : class, IEntity<TKey>
    {
        return Context.Set<TEntity>().FromSqlRaw(q);
    }

    public virtual async Task<IEnumerable<TEntity>> GetFromQueryAsync<TEntity>(string q, params object[] parameters)
        where TEntity : class, IEntity<TKey>
    {
        return await Task.FromResult(Context.Set<TEntity>().FromSqlRaw(q,parameters));
    }

    public virtual async Task<int> RunQueryAsync(string q, params object[] parameter)
    {
        return await Context.Database.ExecuteSqlRawAsync(q, parameter);
    }
    public virtual async Task<IEnumerable<TEntity>> RunQueryAsync<TEntity>(string q) where TEntity : class, IEntity<TKey>
    {
        return await Task.FromResult(Context.Set<TEntity>().FromSqlRaw(q).AsNoTracking());
    }
    public virtual async Task<IEnumerable<TEntity>> RunQueryByInclude<TEntity>(string q, Expression<Func<TEntity, object>> include) where TEntity : class, IEntity<TKey>
    {
        return await Task.FromResult(Context.Set<TEntity>().FromSqlRaw(q).AsNoTracking().Include(include));
    }
    public virtual async Task<TEntity> GetOneByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        return await (await Query<TEntity>(predicate, cancellationToken)).FirstOrDefaultAsync(cancellationToken: cancellationToken);
    }
    public async Task<IQueryable<TEntity>> GetByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
        where TEntity : class, IEntity<TKey>
    {
        return await Query<TEntity>(predicate, cancellationToken);
    }
    public async Task<bool> UpdateByFilter<TEntity>(Expression<Func<TEntity, bool>> predicate, Expression<Func<TEntity, object>> updateExpression, CancellationToken cancellationToken = default) where TEntity : class, IEntity<TKey>
    {
        return await BulkUpdate<TEntity>(predicate, updateExpression, cancellationToken);
    }
}

public abstract class BaseSqlRepository : BaseSqlRepository<Guid>
{
    public BaseSqlRepository(DbContext context) : base(context)
    {
    }
}