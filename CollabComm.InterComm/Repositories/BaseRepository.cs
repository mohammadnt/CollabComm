using CollabComm.Core.Repositories;

namespace CollabComm.InterComm.Repositories;

public interface IBaseRepository : IBaseSqlRepository
{
}

public class BaseRepository : BaseSqlRepository, IBaseRepository
{
    public BaseRepository(DatabaseContext databaseContext) : base(databaseContext) { }
}