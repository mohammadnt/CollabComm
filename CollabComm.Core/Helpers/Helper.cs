using System.Data;
using System.Data.Common;
using System.Globalization;
using System.Reflection;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace CollabComm.Core.Helpers;

public static class Helper
{
    private static Random random = new Random();

    public static string RandomString(int length)
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return new string(Enumerable.Repeat(chars, length)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    public static List<T> RawSqlQuery<T>(this IdentityDbContext context, string query, Func<DbDataReader, T> map)
    {
        using (var command = context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = query;
            command.CommandType = CommandType.Text;

            context.Database.OpenConnection();

            using (var result = command.ExecuteReader())
            {
                var entities = new List<T>();

                while (result.Read())
                {
                    entities.Add(map(result));
                }

                return entities;
            }
        }
    }


    public static List<T> RawSqlQueryWithDic<T>(this IdentityDbContext context,
        string query, Dictionary<string, object> ps) where T : class, new()
    {
        using (var command = context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = query;
            command.CommandType = CommandType.Text;
            if (ps != null)
                foreach (var item in ps.ToList())
                {
                    NpgsqlParameter param1 = new NpgsqlParameter();
                    param1.ParameterName = item.Key;
                    param1.Value = item.Value;

                    command.Parameters.Add(param1);
                }


            context.Database.OpenConnection();

            using (var result = command.ExecuteReader())
            {
                var entities = new List<T>();
                while (result.Read())
                {
                    T item = new T();
                    CreateRecord<T>(result, item);

                    entities.Add(item);
                }

                return entities;
            }
        }
    }

    public static void CreateRecord<T>(IDataRecord record, T item)
    {
        PropertyInfo[] propertyInfos = typeof(T).GetProperties();

        for (int i = 0; i < record.FieldCount; i++)
        {
            foreach (PropertyInfo propertyInfo in propertyInfos)
            {
                if (propertyInfo.Name == record.GetName(i))
                {
                    var value = record.GetValue(i);
                    object safeValue = (value is DBNull) ? null : Convert.ChangeType(value, record.GetFieldType(i));
                    propertyInfo.SetValue(item, safeValue, null);
                }
            }
        }
    }

    public static List<T> RawSqlQueryWithDic<T>(this IdentityDbContext context,
        string query, Dictionary<string, object> ps, Func<DbDataReader, T> map)
    {
        using (var command = context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = query;
            command.CommandType = CommandType.Text;
            if (ps != null)
                foreach (var item in ps.ToList())
                {
                    NpgsqlParameter param1 = new NpgsqlParameter();
                    param1.ParameterName = item.Key;
                    param1.Value = item.Value;

                    command.Parameters.Add(param1);
                }


            context.Database.OpenConnection();

            using (var result = command.ExecuteReader())
            {
                var entities = new List<T>();

                while (result.Read())
                {
                    entities.Add(map(result));
                }

                return entities;
            }
        }
    }

    public static List<T> RawSqlQuery<T>(this IdentityDbContext context, Guid? userId, string query,
        Func<DbDataReader, T> map)
    {
        using (var command = context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = query;
            command.CommandType = CommandType.Text;
            NpgsqlParameter param1 = new NpgsqlParameter();
            if (userId.HasValue)
            {
                param1.ParameterName = "p1";
                param1.Value = userId.Value;

                command.Parameters.Add(param1);
            }

            context.Database.OpenConnection();

            using (var result = command.ExecuteReader())
            {
                var entities = new List<T>();

                while (result.Read())
                {
                    entities.Add(map(result));
                }

                return entities;
            }
        }
    }

    public static async Task<List<T>> RawSqlQuery<T>(this IdentityDbContext context, string query, object p1, object p2,
        Func<DbDataReader, T> map)
    {
        await using (var command = context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = query;
            command.CommandType = CommandType.Text;
            NpgsqlParameter param1 = new NpgsqlParameter();
            NpgsqlParameter param2 = new NpgsqlParameter();
            if (p1 != null)
            {
                param1.ParameterName = "p1";
                param1.Value = p1;

                command.Parameters.Add(param1);
            }

            if (p2 != null)
            {
                param2.ParameterName = "p2";
                param2.Value = p2;

                command.Parameters.Add(param2);
            }

            context.Database.OpenConnection();

            await using (var result = await command.ExecuteReaderAsync())
            {
                var entities = new List<T>();

                while (result.Read())
                {
                    entities.Add(map(result));
                }

                return entities;
            }
        }
    }

    public static string CreateMD5(string input)
    {
        // Use input string to calculate MD5 hash
        using (System.Security.Cryptography.MD5 md5 = System.Security.Cryptography.MD5.Create())
        {
            byte[] inputBytes = System.Text.Encoding.ASCII.GetBytes(input);
            byte[] hashBytes = md5.ComputeHash(inputBytes);

            return Convert.ToHexString(hashBytes); // .NET 5 +

            // Convert the byte array to hexadecimal string prior to .NET 5
            // StringBuilder sb = new System.Text.StringBuilder();
            // for (int i = 0; i < hashBytes.Length; i++)
            // {
            //     sb.Append(hashBytes[i].ToString("X2"));
            // }
            // return sb.ToString();
        }
    }

    public static string ConvertDigitChar(this string str, CultureInfo source, CultureInfo destination)
    {
        for (int i = 0; i <= 9; i++)
        {
            str = str.Replace(source.NumberFormat.NativeDigits[i], destination.NumberFormat.NativeDigits[i]);
        }

        return str;
    }

    public static string ConvertDigitChar(this int digit, CultureInfo destination)
    {
        string res = digit.ToString();
        for (int i = 0; i <= 9; i++)
        {
            res = res.Replace(i.ToString(), destination.NumberFormat.NativeDigits[i]);
        }

        return res;
    }

}