using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using CollabComm.Core.Models;

namespace CollabComm.Core.Repositories;

public abstract class BaseRepository<TKey, TEntity> : IBaseRepository<TKey, TEntity>
    where TEntity : class, IEntity<TKey>
    where TKey : IEquatable<TKey>
{

    protected readonly DbContext Context;
    protected readonly DbSet<TEntity> Entities;

    public BaseRepository(DbContext context)
    {
        Context = context;
        Entities = context.Set<TEntity>();
    }

    public virtual async Task<int> SaveChanges(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return await Context.SaveChangesAsync();
    }

    public virtual async Task Delete(TKey id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var entity = await Entities.SingleOrDefaultAsync(s => s.id.Equals(id));
        Entities.Remove(entity);
    }

    public virtual async Task DeleteMany(IEnumerable<TKey> ids, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var entities = await Entities.Where(s => ids.Contains(s.id)).ToListAsync();
        Entities.RemoveRange(entities);
    }

    public virtual async Task<IEnumerable<TEntity>> GetAll(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await Task.Run(() => Query().AsEnumerable());
    }

    public virtual async Task<TEntity> GetById(TKey id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await Query(s => s.id.Equals(id), cancellationToken).SingleOrDefaultAsync();
    }

    public virtual async Task<IEnumerable<TEntity>> GetByIds(IEnumerable<TKey> ids, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return await Task.Run(() => Query(s => ids.Contains(s.id)).AsEnumerable());
    }

    public virtual async Task Insert(TEntity entity, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await Entities.AddAsync(entity);
    }

    public virtual async Task InsertMany(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await Context.AddRangeAsync(entities, cancellationToken);
        //await Entities.AddRangeAsync(entities);
    }

    public virtual async Task Update(TEntity entity, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await Task.Run(() => Context.Entry(entity).State = EntityState.Modified);
    }

    protected virtual IQueryable<TEntity> Query(Expression<Func<TEntity, bool>> predicate, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Entities.AsNoTracking().Where(predicate);
    }

    protected virtual IQueryable<TEntity> Query(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Entities.AsNoTracking();
    }
}