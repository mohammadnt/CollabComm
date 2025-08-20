using AutoMapper;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CollabComm.Core.Models;
using CollabComm.InterComm.Models;
using CollabComm.InterComm.Repositories;
using CollabComm.Models;
using Microsoft.EntityFrameworkCore;

namespace CollabComm.Services;

public interface IUserService
{
    Task<CollabUser> GetUser(Guid id, CancellationToken cancellationToken);
    Task<CollabUser> GetUser(string username, CancellationToken cancellationToken);
    Task<Session> GetSession(Guid id, Guid user_id, CancellationToken cancellationToken);

    Task<SessionInfo> GetSessionInfo(Guid id, Guid user_id, CancellationToken cancellationToken);


    Task<List<Role>> GetRoles(Guid userid, CancellationToken cancellationToken);


    Task<bool> UpdateUserPassword(Guid id, string pw, CancellationToken cancellationToken);

    Task<string> GetToken(CollabUser user, string cid, CancellationToken cancellationToken);

    Task<Session> CreateSession(Guid user_id, string user_agent, int client_type, string device_id,
        string app_version, int? store_id, int cacheCleared,
        CancellationToken cancellationToken);

    Task<bool> UpdateSessionDeleted(Guid sessionId, bool deleted,
        CancellationToken cancellationToken);


    Task<CollabUserInfo> GetUserInfo(Guid userId, CancellationToken cancellationToken);
    Task<CollabUserInfo> GetUserInfo(string username, CancellationToken cancellationToken);

    Task<UserGroupInfo> AddToGroup(Guid gpid, Guid userId,
        CancellationToken cancellationToken);

    Task<CollabUser> CreateUser(string username, string password, string first_name, string last_name);

    Task<List<SessionInfo>> GetSubscriptions(Guid userId,
        CancellationToken cancellationToken);

    Task<List<SessionInfo>> GetSubscriptions(List<Guid> userIds,
        CancellationToken cancellationToken);

    Task<bool> UpdateSubscription(Guid connectionId, string subscription,
        CancellationToken cancellationToken);

    Task<bool> UpdateSession(Guid connectionId, DateTime lastDate, string appVersion, int? storeId,
        string? user_agent, int? buildNumber, int clearedCache, CancellationToken cancellationToken);

    Task<bool> UpdateProfilePhoto(Guid userId, Guid? photoId, CancellationToken cancellationToken);
}

public class UserService : IUserService
{
    private readonly DatabaseContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ISqlRepository _sqlRepository;
    private readonly IMapper _mapper;

    public UserService(
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

    

    public async Task<bool> UpdateProfilePhoto(Guid userId, Guid? photoId, CancellationToken cancellationToken)
    {
        var r = await _sqlRepository.UpdateByFilter<CollabUser>(s => s.id == userId,
            s => new { media_id = photoId }, cancellationToken);
        return r;
    }

    public async Task<bool> UpdateSession(Guid connectionId, DateTime lastDate, string appVersion, int? storeId,
        string? user_agent, int? buildNumber, int clearedCache, CancellationToken cancellationToken)
    {
        return await _sqlRepository.UpdateByFilter<Session>(s => s.id == connectionId,
            s => new
            {
                last_online_date = lastDate, app_version = appVersion, store_id = storeId,
                user_agent = user_agent ?? s.user_agent, build_number = buildNumber,
                cache_cleared = clearedCache
            },
            cancellationToken);
    }
    public async Task<bool> UpdateSubscription(Guid connectionId, string subscription,
        CancellationToken cancellationToken)
    {
        return await _sqlRepository.UpdateByFilter<Session>(s => s.id == connectionId,
            s => new { subscription = subscription }, cancellationToken);
    }

    public async Task<List<SessionInfo>> GetSubscriptions(List<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var x = (await _sqlRepository.GetByFilter<Session>(
            s => userIds.Contains(s.user_id) && s.deleted == false &&
                 (DateTime.UtcNow - s.last_online_date).Value.Days < 7,
            cancellationToken));
        return _mapper.Map<List<SessionInfo>>(x);
    }

    public async Task<List<SessionInfo>> GetSubscriptions(Guid userId,
        CancellationToken cancellationToken)
    {
        var x = (await _sqlRepository.GetByFilter<Session>(
            s => s.user_id == userId && s.deleted == false &&
                 (DateTime.UtcNow - s.last_online_date).Value.Days < 7,
            cancellationToken));
        return _mapper.Map<List<SessionInfo>>(x);
    }

    public async Task<CollabUser> CreateUser(string username, string password, string first_name, string last_name)
    {
        var user = await _sqlRepository.Insert(
            new CollabUser()
            {
                first_name = first_name,
                last_name = last_name,
                username = username,
                password = password,
                type = (int)UserType.User
            }, default);
        return user;
    }

    public async Task<UserGroupInfo> AddToGroup(Guid gpid, Guid userId,
        CancellationToken cancellationToken)
    {
        var currentUg = (await _sqlRepository.GetByFilter<UserGroup>(
            s2 => s2.group_id == gpid && s2.user_id == userId,
            cancellationToken)).FirstOrDefault();
        if (currentUg != null)
        {
            if (currentUg.deleted == true)
                await _sqlRepository.UpdateByFilter<UserGroup>(x => x.id == currentUg.id,
                    s => new { deleted = false },
                    cancellationToken);
            return _mapper.Map<UserGroupInfo>(currentUg);
        }

        var s = UserGroup.Generate(gpid, userId, false, false);
        var x = await _sqlRepository.Insert(s, cancellationToken);
        return _mapper.Map<UserGroupInfo>(x);
    }

    public async Task<CollabUser> GetUser(Guid id, CancellationToken cancellationToken)
    {
        return await _sqlRepository.GetById<CollabUser>(id, cancellationToken);
    }

    public async Task<CollabUser> GetUser(string username, CancellationToken cancellationToken)
    {
        return (await _sqlRepository.GetByFilter<CollabUser>(s => s.username == username, cancellationToken))
            .FirstOrDefault();
    }

    public async Task<bool> UpdateUserPassword(Guid id, string pw, CancellationToken cancellationToken)
    {
        var s = await _sqlRepository.UpdateByFilter<CollabUser>(s => s.id == id,
            s => new { password = pw },
            cancellationToken);
        _ = await _sqlRepository.UpdateByFilter<Session>(s => s.id == id,
            s => new { deleted = true },
            cancellationToken);

        return s;
    }

    public async Task<Session> GetSession(Guid id, Guid user_id, CancellationToken cancellationToken)
    {
        var s = await _sqlRepository.GetById<Session>(id, cancellationToken);
        if (s != null && (s.user_id != user_id || s.deleted == true))
            s = null;
        return s;
    }

    public async Task<SessionInfo> GetSessionInfo(Guid id, Guid user_id, CancellationToken cancellationToken)
    {
        var s = await _sqlRepository.GetById<Session>(id, cancellationToken);
        if (s.user_id != user_id || s.deleted == true)
            s = null;
        return _mapper.Map<SessionInfo>(s);
    }

    public async Task<List<Role>> GetRoles(Guid userid, CancellationToken cancellationToken)
    {
        return await _dbContext.user_role.Where(x => x.user_id == userid)
            .Join(_dbContext.role,
                ur => ur.role_id, r => r.id,
                (ur, r) => r).ToListAsync(cancellationToken);
    }


    public async Task<Session> CreateSession(Guid user_id, string user_agent, int client_type,
        string device_id, string app_version, int? store_id, int cacheCleared,
        CancellationToken cancellationToken)
    {
        var oldSession =
            await _sqlRepository.GetOneByFilter<Session>(s => s.device_id == device_id,
                cancellationToken);
        if (oldSession != null)
        {
            await _sqlRepository.UpdateByFilter<Session>(s => s.device_id == device_id,
                s => new
                {
                    deleted = false,
                    user_id = user_id,
                    user_agent = user_agent,
                    client_type = client_type,
                    device_id = device_id,
                    cache_cleared = cacheCleared
                }, cancellationToken);
            var updatedSession =
                await _sqlRepository.GetOneByFilter<Session>(s => s.device_id == device_id,
                    cancellationToken);
            return updatedSession;
        }

        var c = await _sqlRepository.Insert(
            Session.Generate(user_id, user_agent, client_type, device_id, app_version, store_id,
                cacheCleared),
            cancellationToken);

        // await _sqlReservationRepository.SaveChanges();


        return c;
    }


    public async Task<string> GetToken(CollabUser user, string cid, CancellationToken cancellationToken)
    {
        var roles = await GetRoles(user.id, cancellationToken);

        return GenerateJwtToken(user.id.ToString(), string.Join(",", roles.Select(s => s.title)), cid.ToString());
    }

    private string GenerateJwtToken(string userId, string roles, string cid)
    {
        var auth = _configuration.GetSection("authentication");
        var secret = auth.GetValue<string>("secret");
        var projectName = auth.GetValue<string>("projectName");
        var issuer = auth.GetValue<string>("issuer");

        var symmetricKey = Convert.FromBase64String(secret);

        // generate token that is valid for 7 days
        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Issuer = issuer,
            Audience = issuer,
            Subject = new ClaimsIdentity(
                new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Role, roles),
                    new Claim(ClaimTypes.Name, projectName),
                    new Claim(ClaimTypes.Sid, cid)
                }),
            Expires = DateTime.UtcNow.AddDays(3 * 12 * 30),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(symmetricKey),
                SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<bool> UpdateSessionDeleted(Guid sessionId, bool deleted,
        CancellationToken cancellationToken)
    {
        return await _sqlRepository.UpdateByFilter<Session>(s => s.id == sessionId,
            s => new { deleted = deleted, }, cancellationToken);
    }

    public async Task<CollabUserInfo> GetUserInfo(Guid userId, CancellationToken cancellationToken)
    {
        var q = await _sqlRepository.GetById<CollabUser>(userId, cancellationToken);
        return _mapper.Map<CollabUserInfo>(q);
    }

    public async Task<CollabUserInfo> GetUserInfo(string username, CancellationToken cancellationToken)
    {
        var q = (await _sqlRepository.GetByFilter<CollabUser>(s => s.username == username, cancellationToken))
            .FirstOrDefault();
        return _mapper.Map<CollabUserInfo>(q);
    }
}