using System.Security.Claims;

namespace CollabComm.Core;

public interface IApplicationContext<TUserKey> where TUserKey : IEquatable<TUserKey>
{
    public TUserKey UserId { get; set; }
    public TUserKey SessionId { get; set; }
    public TUserKey Roles { get; set; }
    public ClaimsPrincipal User { get; }
    public string AccessToken { get; }
}
public interface IApplicationContext : IApplicationContext<string>
{
    public Guid UserIdGuid {
        get
        {
            if (UserId == null)
                return Guid.Empty;
            return new Guid(UserId);
        }
    }
    public Guid? NullbaleUserIdGuid {
        get
        {
            if (UserId == null)
                return null;
            return new Guid(UserId);
        }
    }
    public Guid SessionIdGuid {
        get
        {
            if (SessionId == null)
                return Guid.Empty;
            return new Guid(SessionId);
        }
    }
}