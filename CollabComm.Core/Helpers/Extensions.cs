using System.Runtime.InteropServices;

namespace CollabComm.Core.Helpers;

public static class Extension
{
    public static bool ExistsInValues(this IComparable obj, params IComparable[] values)
    {
        foreach (var value in values)
        {
            if (obj.Equals(value))
            {
                return true;
            }
        }

        return false;
    }

    public static void MyForEach<T>(this IEnumerable<T> enumeration, Action<T> action)
    {
        foreach (T item in enumeration)
        {
            action(item);
        }
    }

    public static string FolderSplitterByPlatform(this string path)
    {
        return RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? path.Replace("/", "\\") : path;
    }
}