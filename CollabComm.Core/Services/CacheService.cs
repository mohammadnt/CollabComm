using System.Runtime.Caching;

namespace CollabComm.Core.Services;

public interface ICacheService
{
    /// <summary>
    /// Get Data using key
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="key"></param>
    /// <returns></returns>
    T GetData<T>(string key);

    /// <summary>
    /// Set Data with Value and Expiration Time of Key
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="key"></param>
    /// <param name="value"></param>
    /// <param name="expirationTime"></param>
    /// <returns></returns>
    bool SetData<T>(string key, T value, DateTimeOffset expirationTime);

    /// <summary>
    /// Remove Data
    /// </summary>
    /// <param name="key"></param>
    /// <returns></returns>
    object RemoveData(string key);
}

public class CacheService: ICacheService {
    ObjectCache _memoryCache = MemoryCache.Default;
    public T GetData < T > (string key) {
        try {
            T item = (T) _memoryCache.Get(key);
            return item;
        } catch (Exception e) {
            throw;
        }
    }
    public bool SetData < T > (string key, T value, DateTimeOffset expirationTime) {
        bool res = true;
        try {
            if (!string.IsNullOrEmpty(key)) {
                _memoryCache.Set(key, value, expirationTime);
            }
        } catch (Exception e) {
            throw;
        }
        return res;
    }
    public object RemoveData(string key) {
        try {
            if (!string.IsNullOrEmpty(key)) {
                return _memoryCache.Remove(key);
            }
        } catch (Exception e) {
            throw;
        }
        return false;
    }
}