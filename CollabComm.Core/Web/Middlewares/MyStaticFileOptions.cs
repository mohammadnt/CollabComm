using CollabComm.Core.Helpers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

namespace CollabComm.Core.Web.Middlewares;

public class MyStaticFileOptions : StaticFileOptions
{
    public MyStaticFileOptions()
    {
        var filesMainPath = CollabCommPathHelper.GetUserFilesMainPath;
        if (!Directory.Exists(filesMainPath))
            Directory.CreateDirectory(filesMainPath);
        var publicFilesMainPath = CollabCommPathHelper.GetPublicFilesMainPath;
        if (!Directory.Exists(publicFilesMainPath))
            Directory.CreateDirectory(publicFilesMainPath);
        
        FileProvider = new PhysicalFileProvider(publicFilesMainPath);
        
        var provider = new FileExtensionContentTypeProvider();
        provider.Mappings.Remove(".*");
        provider.Mappings[".*"] = "application/octet-stream";
        provider.Mappings.Remove(".srt");
        provider.Mappings[".srt"] = "text/plain";
        provider.Mappings.Remove(".vtt");
        provider.Mappings[".vtt"] = "text/plain";
        provider.Mappings.Remove(".apk");
        provider.Mappings[".apk"] = "application/vnd.android.package-archive";
        
        ContentTypeProvider = provider;
        
        
    }
}

public class StaticFileDetector
{
    private MyStaticFileOptions _sfo;

    public StaticFileDetector(IOptions<MyStaticFileOptions> sfo)
    {
        this._sfo = sfo.Value;
    }

    public bool? FileExists(PathString path)
    {
        // you might custom it as you like
        var baseUrl = this._sfo.RequestPath;

        // get the relative path
        PathString relativePath = null;
        if (!path.StartsWithSegments(baseUrl, out relativePath))
        {
            return null;
        }

        var file = this._sfo.FileProvider.GetFileInfo(relativePath.Value);
        return !file.IsDirectory && file.Exists;
    }
}