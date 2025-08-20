using AutoMapper;
using CollabComm.InterComm.Models;
using CollabComm.InterComm.Repositories;
using CollabComm.Models;

namespace CollabComm.Services;

public interface IMainService
{
    Task<Error> AddError(Guid? userId, string data, string error, string stackTrace,
        CancellationToken cancellationToken);

    Task<PublicUserMedia> AddPublicUserMedia(Guid userId, int type, string mimeType, string path,
        CancellationToken cancellationToken);

    Task<PublicUserMediaInfo> GetPublicUserMedia(Guid id, CancellationToken cancellationToken);

    Task<bool> UpdateSession(Guid sessionId, int clearedCache,
        CancellationToken cancellationToken);
}

public class MainService : IMainService
{
    private readonly DatabaseContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ISqlRepository _sqlRepository;
    private readonly IMapper _mapper;

    public MainService(
        DatabaseContext dbContext,
        IMapper mapper,
        IConfiguration configuration,
        ISqlRepository sqlRepository)
    {
        _mapper = mapper;
        _dbContext = dbContext;
        _configuration = configuration;
        _sqlRepository = sqlRepository;
    }

    public async Task<Error> AddError(Guid? userId, string data, string error, string stackTrace,
        CancellationToken cancellationToken)
    {
        var s = (await _sqlRepository.Insert(
            Error.Generate(userId, data, error, stackTrace, null, null, null),
            cancellationToken));
        return s;
    }
    
    
    public async Task<PublicUserMediaInfo> GetPublicUserMedia(Guid id, CancellationToken cancellationToken)
    {
        var media = (await _sqlRepository.GetById<PublicUserMedia>(id, cancellationToken));
        return _mapper.Map<PublicUserMediaInfo>(media);
    }
    
    public async Task<PublicUserMedia> AddPublicUserMedia(Guid userId, int type, string mimeType, string path,
        CancellationToken cancellationToken)
    {
        var media = await _sqlRepository.Insert(
            PublicUserMedia.Generate(userId, type, mimeType, path),
            cancellationToken);


        return _mapper.Map<PublicUserMedia>(media);
    }
    
    

    public async Task<bool> UpdateSession(Guid sessionId, int clearedCache,
        CancellationToken cancellationToken)
    {
        return await _sqlRepository.UpdateByFilter<Session>(s => s.id == sessionId,
            s => new
            {
                cache_cleared = clearedCache
            },
            cancellationToken);
    }
}