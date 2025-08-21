using System.Runtime.InteropServices;

namespace CollabComm.Core.Helpers;

public static class CollabCommPathHelper
{
    public static string GetRoot
    {
        get
        {
            var linux = RuntimeInformation.IsOSPlatform(OSPlatform.Linux);
            var mac = RuntimeInformation.IsOSPlatform(OSPlatform.OSX);
            if (mac || linux)
                return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                    "CollabCommFiles/");

            return @"C:\CollabComm\";
        }
    }
    

    public static string FixSlashes(string path)
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            path = path.Replace("/", "\\");
        else
            path = path.Replace("\\", "/");
        if (path.StartsWith("\\"))
            path = path.Substring(1, path.Length - 1);
        if (path.StartsWith("/"))
            path = path.Substring(1, path.Length - 1);
        return path;
    }

    public static string GetUserFilesMainPath
    {
        get
        {
            var linux = RuntimeInformation.IsOSPlatform(OSPlatform.Linux);
            var mac = RuntimeInformation.IsOSPlatform(OSPlatform.OSX);
            if (mac || linux)
                return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                    "CollabComm/UserFiles");

            return Path.Combine(@"C:\CollabComm\", "UserFiles");
        }
    }

    public static string GetPublicFilesMainPath
    {
        get
        {
            var linux = RuntimeInformation.IsOSPlatform(OSPlatform.Linux);
            var mac = RuntimeInformation.IsOSPlatform(OSPlatform.OSX);
            if (mac || linux)
                return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                    "CollabComm/PublicFiles");

            return Path.Combine(@"C:\CollabComm\", "PublicFiles");
        }
    }
    public static string GetPrivateFilesMainPath
    {
        get
        {
            var linux = RuntimeInformation.IsOSPlatform(OSPlatform.Linux);
            var mac = RuntimeInformation.IsOSPlatform(OSPlatform.OSX);
            if (mac || linux)
                return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                    "Public/PrivateFiles");

            return Path.Combine(@"C:\Public\", "PrivateFiles");
        }
    }
}