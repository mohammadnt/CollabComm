using System.Runtime.InteropServices;
using CollabComm.Core;
using CollabComm.Core.Helpers;
using CollabComm.Core.Web.Controllers;
using CollabComm.Core.Web.Extensions;
using CollabComm.DTO;
using CollabComm.InterComm.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabComm.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]/[action]")]
public class MediaController : BaseController
{
    private readonly IMainService _mainService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public MediaController(IApplicationContext app, 
        IMainService mainService,
        IHttpContextAccessor httpContextAccessor) : base(app)
    {
        _mainService = mainService;
        _httpContextAccessor = httpContextAccessor;
    }


    [HttpGet]
    public async Task<object> PublicUserMedia(Guid id, CancellationToken cancellationToken = default)
    {
        var media = await _mainService.GetPublicUserMedia(id, cancellationToken);
        if (media != null)
        {
            string path = media.path;
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                path = path.Replace("/", "\\");
            else
                path = path.Replace("\\", "/");
            string fullPath = Path.Combine(CollabCommPathHelper.GetUserFilesMainPath, path);
            if (System.IO.File.Exists(fullPath))
            {
                byte[] bytes = await System.IO.File.ReadAllBytesAsync(fullPath, cancellationToken);
                HttpContext.Response.Headers.AddDefaultCacheValue();
                return File(bytes, media.mime_type, Path.GetFileName(fullPath));
            }
            else
            {
                HttpContext.Response.Headers.AddDefaultCacheValue(2);
                return Content("File not exists");
            }
        }

        return null;
    }


    [HttpPost]
    public async Task<object> AddPublicUserMedia(
        [ModelBinder(BinderType = typeof(JsonModelBinder))]
        AddMediaRequestDTO model, List<IFormFile> files,
        CancellationToken cancellationToken = default)
    {
        string path = "";
        try
        {
            var file = files.First();
            if (file.Length > 0)
            {
                path = Path.Combine("public_user_media", file.FileName);
                var dirPath = Path.Combine(CollabCommPathHelper.GetUserFilesMainPath, "public_user_media");
                if (!Directory.Exists(dirPath))
                {
                    Directory.CreateDirectory(dirPath);
                }

                var fullPath = Path.Combine(CollabCommPathHelper.GetUserFilesMainPath, path);
                using (var fileStream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                var userMedia = await _mainService.AddPublicUserMedia(new Guid(App.UserId), model.type,
                    model.MimeType,
                    path, cancellationToken);
                return new ResultSet<object>(userMedia.id);
            }
            else
            {
                return null;
            }
        }
        catch (Exception ex)
        {
            return new ResultSet<object>(ex.ToString());
        }
    }
}