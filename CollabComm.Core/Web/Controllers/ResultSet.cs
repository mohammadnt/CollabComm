namespace CollabComm.Core.Web.Controllers;

public class ResultSet<TResult>
{
    public ResultSet() { }
    public ResultSet(TResult data)
    {
        this.data = data;
    }
    public ResponseCodes code { get; set; } = ResponseCodes.OK;
    public TResult data { get; set; }
    public List<string> errors { get; } = new List<string>();
}