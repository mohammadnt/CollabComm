using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens;
using CollabComm.Core.Config;
using CollabComm.Core.Helpers;

namespace CollabComm.Core.Web.Middlewares;

public class AuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _projectName;
    private readonly string _issuer;
    private readonly byte[] _symmetricKey;
    private readonly IWebHostEnvironment _hostingEnvironment;

    public AuthenticationMiddleware(
        RequestDelegate next,
        AuthConfig authConfig,
        IWebHostEnvironment hostingEnvironment)
    {
        _next = next;
        var secret = authConfig.secret;
        _projectName = authConfig.projectName;
        _issuer = authConfig.issuer;
        _symmetricKey = Convert.FromBase64String(secret);
        _hostingEnvironment = hostingEnvironment;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            var role = "";
            var cid = "";
            var result = GetAccess(context.Request, out role, out cid);
            if (!string.IsNullOrEmpty(result))
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, result),
                    new Claim(ClaimTypes.Role, role),
                    new Claim(ClaimTypes.Sid, cid)
                };

                var identity = new ClaimsIdentity(claims, "Basic");
                var principal = new ClaimsPrincipal(identity);

                context.User = principal;
                context.Items["Account"] = principal;
            }
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        }
        finally
        {
            await _next(context);
        }
    }

    private string GetAccess(HttpRequest request, out string role, out string cid)
    {
        var site = _issuer.GetSiteName();

        if (request.Cookies.ContainsKey("token"))
        {
            var token = request.Cookies["token"];
            return GetPrincipal(token, _issuer, _symmetricKey, _projectName, out role, out cid);
        }

        bool hasAuth = request.Headers.TryGetValue("Authorization", out StringValues authHeader);
        if (hasAuth &&
            authHeader.ToString().StartsWith(site, StringComparison.OrdinalIgnoreCase))
        {
            if (authHeader.ToString().Length > site.Length)
            {
                var token = authHeader.ToString()[(site.Length + 1)..].Trim();
                return GetPrincipal(token, _issuer, _symmetricKey, _projectName, out role,
                    out cid);
            }
        }

        if (_hostingEnvironment.IsDevelopment())
        {
            if (request.Query.TryGetValue("Authorization", out StringValues qsAuthHeader) &&
                qsAuthHeader.ToString().StartsWith(site, StringComparison.OrdinalIgnoreCase))
            {
                var token = qsAuthHeader.ToString()[(site.Length + 1)..].Trim();
                return GetPrincipal(token, _issuer, _symmetricKey, _projectName, out role,
                    out cid);
            }
        }

        role = "";
        cid = "";
        return string.Empty;
    }

    public static string GetPrincipal(string token, string _issuer, byte[] _symmetricKey, string _projectName, out string role, out string cid)
    {
        role = "";
        cid = "";
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadJwtToken(token);

        if (jwtToken == null) return null;

        tokenHandler.ValidateToken(token, new TokenValidationParameters
        {
            RequireExpirationTime = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(_symmetricKey),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false,
            ClockSkew = TimeSpan.Zero,
            ValidIssuer = _issuer,
            ValidAudience = _issuer
        }, out SecurityToken validatedToken);

        jwtToken = (JwtSecurityToken)validatedToken;
        cid = jwtToken.Claims.First(x => x.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid")
            .Value;
        var userId = jwtToken.Claims.First(x => x.Type == "nameid").Value;
        try
        {
            role = jwtToken.Claims.First(x => x.Type == "role")?.Value;
        }
        catch
        {
        }

        var projectName = jwtToken.Claims.First(x => x.Type == "unique_name").Value;

        if (projectName?.ToLower() != _projectName?.ToLower())
        {
            userId = string.Empty;
        }

        return userId;
    }
}