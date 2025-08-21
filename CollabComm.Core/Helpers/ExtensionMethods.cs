using Microsoft.AspNetCore.Http;

namespace CollabComm.Core.Helpers;

public static class ExtensionMethods
{
    public static void AddCookie(this HttpResponse Response, bool isDevelopment, string name, string value)
    {
        bool secure = true;
        string host = Response.HttpContext.Request.Host.Host;
        if (isDevelopment)
        {
            secure = false;
        }

        Response.Cookies.Append(name, value, new CookieOptions
        {
            Expires = DateTime.Now.AddDays(6 * 30),
            Secure = secure,
            Domain = host
        });
    }

    public static void DeleteCookie(this HttpResponse Response, string name)
    {
        Response.Cookies.Delete(name);
    }
    public static string GetSiteName(this string site)
    {
        site = site.Replace("https://", "").Replace("http://", "").Replace("www.", "");
        if (site.IndexOf(":") > -1)
            site = site.Substring(0, site.IndexOf(":"));
        return site;
    }

    public static DateTime StartOfDay(this DateTime date, int hour = 0)
    {
        return new DateTime(date.Year, date.Month, date.Day, hour, 0, 0);
    }

    public static string GetRandomNumber(this string str, int count = 4, string chars = "123456789")
    {
        var random = new Random();
        return new string(
            Enumerable.Repeat(chars, count)
                .Select(s => s[random.Next(s.Length)])
                .ToArray());
    }

    public static int? MyToInt(this string obj)
    {
        if (obj != null)
        {
            if (int.TryParse(obj, out int i)) return i;
        }

        return null;
    }

    public static Guid? ToGuid(this object obj)
    {
        if (obj != null)
        {
            var temp = obj.ToString();
            return new Guid(temp);
        }

        return null;
    }
}