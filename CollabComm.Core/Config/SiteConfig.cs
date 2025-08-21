namespace CollabComm.Core.Config;

public class SiteConfig
{
    public string FullSiteUrl { get; set; }
    public bool IsMaintenanceMode { get; set; }
    public int AndroidForceUpdateBuildNumber { get; set; }
    public int CacheCleared { get; set; }
}