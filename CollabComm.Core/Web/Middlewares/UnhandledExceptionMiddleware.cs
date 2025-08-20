using CollabComm.Core.Web.Controllers;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;

namespace CollabComm.Core.Web.Middlewares;

public class UnhandledExceptionMiddleware
{
    private bool _changeResponse = true;
    private bool _changeResponseForCrash = false;
    private readonly RequestDelegate next;

    public UnhandledExceptionMiddleware(RequestDelegate next)
    {
        this.next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleException(context, ex);
        }
    }

    private async Task HandleException(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)ResponseCodes.UnhandledException;
        try
        {
            // Insert to database in case needed
        }
        catch (Exception e2)
        {
            if (_changeResponseForCrash)
            {
                var resultSet = new ResultSet<object>
                {
                    code = ResponseCodes.UnhandledException
                };
                resultSet.errors.Add(GetExceptionMessage(ex));
                //resultSet.Errors.Add(ex.Message + "\n" + ex.StackTrace);
                string result = JsonConvert.SerializeObject(resultSet);

                context.Response.WriteAsync(result);
            }
        }

        if (_changeResponse)
        {
            var resultSet = new ResultSet<object>
            {
                code = ResponseCodes.UnhandledException
            };
            resultSet.errors.Add(GetExceptionMessage(ex));
            //resultSet.Errors.Add(ex.Message + "\n" + ex.StackTrace);
            string result = JsonConvert.SerializeObject(resultSet);

            context.Response.WriteAsync(result);
        }
    }

    private static string GetExceptionMessage(Exception ex)
    {
        if (ex.InnerException == null) return ex.Message;
        return ex.Message + " \n " + GetExceptionMessage(ex.InnerException);
    }
}