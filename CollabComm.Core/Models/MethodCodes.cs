namespace CollabComm.Core.Models;

public enum MethodCode
{
    send_message = 1,
    send_message_resposne = 2,
    ping = 3,
    sync = 4,
    CafeNewOrder = 101,
}
public enum SyncMethod
{
    seen = 1,
    delete = 2,
}