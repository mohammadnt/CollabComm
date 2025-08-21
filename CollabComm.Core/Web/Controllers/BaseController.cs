using Microsoft.AspNetCore.Mvc;

namespace CollabComm.Core.Web.Controllers;

public abstract class BaseController : ControllerBase
{
    public IApplicationContext App { get; private set; }
    public BaseController(IApplicationContext app)
    {
        App = app;
    }
}