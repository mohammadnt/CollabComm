using CollabComm.Core.Config;
using CollabComm.Core.Models;
using CollabComm.Models;
using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace CollabComm.InterComm.Services;

public interface IPushService
{
    Task<int> SendNotifications(IUserService userService, PushServiceClient pushClient, Guid userId,
        Guid target_id,
        string title, string body,
        CancellationToken cancellationToken);

    Task<int> SendNotifications( PushServiceClient pushClient, List<UserGroupInfo> userId,
        Guid target_id,
        string title, string body,
        CancellationToken cancellationToken);

    Task<int> SendNotifications(IUserService userService, PushServiceClient pushClient, List<Guid> userId,
        string title, string body,
        CancellationToken cancellationToken);
}

public class PushService : IPushService
{
    private readonly PushNotificationsOptions _pno;
    private readonly SiteConfig _siteConfig;

    // private readonly FcmNotificationSetting _fcmNotificationSetting;

    public PushService(
        PushNotificationsOptions pno,
        SiteConfig siteConfig
        /*, FcmNotificationSetting fcmNotificationSetting,*/)
    {
        _pno = pno;
        _siteConfig = siteConfig;
        // _fcmNotificationSetting = fcmNotificationSetting;
    }

    public async Task<int> SendNotifications(IUserService userService, PushServiceClient pushClient, Guid userId,
        Guid target_id, string title, string body,
        CancellationToken cancellationToken)
    {
        pushClient.DefaultAuthentication = new VapidAuthentication(_pno.PublicKey, _pno.PrivateKey)
        {
            Subject = _siteConfig.FullSiteUrl
        };
        var connections = (await userService.GetSubscriptions(userId, cancellationToken));
        return await this.SendToSessions(pushClient, connections, target_id, title, body,
            cancellationToken);
    }

    public async Task<int> SendNotifications(PushServiceClient pushClient,
        List<UserGroupInfo> userGroups,
        Guid target_id, string title, string body,
        CancellationToken cancellationToken)
    {
        pushClient.DefaultAuthentication = new VapidAuthentication(_pno.PublicKey, _pno.PrivateKey)
        {
            Subject = _siteConfig.FullSiteUrl
        };
        var connections = userGroups.SelectMany(s => s.sessions.Where(s2 => s2 != null));
        return await this.SendToSessions( pushClient, connections.ToList(), target_id, title, body,
            cancellationToken);
    }

    public async Task<int> SendToSessions(PushServiceClient pushClient,
        List<SessionInfo> sessions,
        Guid target_id, string title, string body,
        CancellationToken cancellationToken)
    {
        foreach (var session in sessions)
        {
            if ((DateTime.UtcNow - session.last_online_date).Value.Days > 7)
                continue;
            if (string.IsNullOrEmpty(session.subscription))
                continue;
            var clientType = (ClientTypes)session.client_type;
            switch (clientType)
            {
                case ClientTypes.Web:

                    PushMessage notification = new AngularPushNotification
                    {
                        Data = new Dictionary<string, object>()
                        {
                            { "target_id", target_id }, { "type", 1 }, { "url", _siteConfig.FullSiteUrl }
                        },
                        Actions = new List<AngularPushNotification.NotificationAction>()
                            { },
                        Vibrate = new List<int>() { 300, 100, 400, 100, 400, 100, 400 },
                        Title = title,
                        Body = body,
                        requireInteraction = true,
                        Icon = "assets/icons/icon-96x96.png"
                    }.ToPushMessage();
                    await pushClient.RequestPushMessageDeliveryAsync(
                        JsonConvert.DeserializeObject<PushSubscription>(session.subscription), notification,
                        cancellationToken);
                    break;
                case ClientTypes.Android:
                    // FCMNotificationModel androidNotification = new FCMNotificationModel
                    // {
                    //     Title = title, Body = body, DeviceId = connection.subscription, IsAndroidDevice = true
                    // };
                    // await SendAndroidNotification(androidNotification, cancellationToken);
                    break;
            }
        }

        return sessions.Count;
    }

    public async Task<int> SendNotifications(IUserService userService, PushServiceClient pushClient, List<Guid> userIds,
        string title, string body, CancellationToken cancellationToken)
    {
        pushClient.DefaultAuthentication = new VapidAuthentication(_pno.PublicKey, _pno.PrivateKey)
        {
            Subject = _siteConfig.FullSiteUrl
        };
        var sessions = (await userService.GetSubscriptions(userIds, cancellationToken));


        foreach (var session in sessions)
        {
            if ((DateTime.UtcNow - session.last_online_date).Value.Days > 7)
                continue;
            if (string.IsNullOrEmpty(session.subscription))
                continue;
            var clientType = (ClientTypes)session.client_type;
            switch (clientType)
            {
                case ClientTypes.Web:

                    PushMessage notification = new AngularPushNotification
                    {
                        Data = new Dictionary<string, object>()
                        {
                            { "target_id", "cafe-admin" }, { "type", 1 }, { "url", _siteConfig.FullSiteUrl }
                        },
                        Actions = new List<AngularPushNotification.NotificationAction>()
                            { },
                        Vibrate = new List<int>() { 300, 100, 400, 100, 400, 100, 400 },
                        Title = title,
                        Body = body,
                        requireInteraction = true,
                        Icon = "assets/icons/icon-96x96.png"
                    }.ToPushMessage();
                    await pushClient.RequestPushMessageDeliveryAsync(
                        JsonConvert.DeserializeObject<PushSubscription>(session.subscription), notification,
                        cancellationToken);
                    break;
                case ClientTypes.Android:
                    // FCMNotificationModel androidNotification = new FCMNotificationModel
                    // {
                    //     Title = title, Body = body, DeviceId = connection.subscription, IsAndroidDevice = true
                    // };
                    // await SendAndroidNotification(androidNotification, cancellationToken);
                    break;
            }
        }

        return sessions.Count;
    }

    // private async Task<ResponseModel> SendAndroidNotification(FCMNotificationModel notificationModel,
    //     CancellationToken cancellationToken)
    // {
    //     ResponseModel response = new ResponseModel();
    //     try
    //     {
    //         if (notificationModel.IsAndroidDevice)
    //         {
    //             /* FCM Sender (Android Device) */
    //             FcmSettings settings = new FcmSettings()
    //             {
    //                 SenderId = _fcmNotificationSetting.SenderId,
    //                 ServerKey = _fcmNotificationSetting.ServerKey
    //             };
    //             HttpClient httpClient = new HttpClient();
    //
    //             string authorizationKey = string.Format("key={0}", settings.ServerKey);
    //             string deviceToken = notificationModel.DeviceId;
    //
    //             httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", authorizationKey);
    //             httpClient.DefaultRequestHeaders.Accept
    //                 .Add(new MediaTypeWithQualityHeaderValue("application/json"));
    //
    //             GoogleNotification.DataPayload dataPayload = new GoogleNotification.DataPayload();
    //             dataPayload.Title = notificationModel.Title;
    //             dataPayload.Body = notificationModel.Body;
    //
    //             GoogleNotification notification = new GoogleNotification();
    //             notification.Data = dataPayload;
    //             notification.Notification = dataPayload;
    //
    //             var fcm = new FcmSender(settings, httpClient);
    //             var fcmSendResponse = await fcm.SendAsync(deviceToken, notification);
    //
    //             if (fcmSendResponse.IsSuccess())
    //             {
    //                 response.IsSuccess = true;
    //                 response.Message = "Notification sent successfully";
    //                 return response;
    //             }
    //             else
    //             {
    //                 response.IsSuccess = false;
    //                 response.Message = fcmSendResponse.Results[0].Error;
    //                 return response;
    //             }
    //         }
    //         else
    //         {
    //             /* Code here for APN Sender (iOS Device) */
    //             //var apn = new ApnSender(apnSettings, httpClient);
    //             //await apn.SendAsync(notification, deviceToken);
    //         }
    //
    //         return response;
    //     }
    //     catch (Exception ex)
    //     {
    //         response.IsSuccess = false;
    //         response.Message = "Something went wrong";
    //         return response;
    //     }
    // }
}

public partial class AngularPushNotification
{
    public class NotificationAction
    {
        public string Action { get; }
        public string Title { get; }

        public NotificationAction(string action, string title)
        {
            Action = action;
            Title = title;
        }
    }

    public string Title { get; set; }
    public string Body { get; set; }
    public string Icon { get; set; }
    public IList<int> Vibrate { get; set; } = new List<int>();
    public IDictionary<string, object> Data { get; set; }
    public IList<NotificationAction> Actions { get; set; } = new List<NotificationAction>();
    public string tag { get; set; } = "";
    public bool requireInteraction { get; set; } = false;
    public bool renotify { get; set; } = false;
}

public partial class AngularPushNotification
{
    private const string WRAPPER_START = "{\"notification\":";
    private const string WRAPPER_END = "}";

    private static readonly JsonSerializerSettings _jsonSerializerSettings = new JsonSerializerSettings
    {
        ContractResolver = new CamelCasePropertyNamesContractResolver()
    };

    public PushMessage ToPushMessage(string topic = null, int? timeToLive = null,
        PushMessageUrgency urgency = PushMessageUrgency.Normal)
    {
        return new PushMessage(WRAPPER_START + JsonConvert.SerializeObject(this, _jsonSerializerSettings) + WRAPPER_END)
        {
            Topic = topic,
            TimeToLive = timeToLive,
            Urgency = urgency
        };
    }
}