using System.ComponentModel.DataAnnotations;

namespace CollabComm.DTO;

public class IdRequestDTO
{
    [Required] public Guid id { get; set; }
}

public class IdWithDateRequestDTO
{
    [Required] public Guid id { get; set; }
    public DateTime? date { get; set; }
}

public class IntWithDateRequestDTO
{
    [Required] public int id { get; set; }
    public DateTime? date { get; set; }
}

public class IdNullRequestDTO
{
    public Guid? id { get; set; }
}

public class IdIdRequestDTO
{
    [Required] public Guid id { get; set; }
    [Required] public Guid second_id { get; set; }
}

public class IdTitleRequestDTO
{
    [Required] public Guid id { get; set; }
    [Required] public string title { get; set; }
}

public class TitleRequestDTO
{
    [Required] public string title { get; set; }
}

public class OptionalTitleRequestDTO
{
    public string? title { get; set; }
}

public class OptionalIntRequestDTO
{
    public int? id { get; set; }
}

public class IntIntRequestDTO
{
    [Required] public int id { get; set; }
    [Required] public int second_id { get; set; }
}

public class IntIntIntRequestDTO
{
    [Required] public int id { get; set; }
    [Required] public int second_id { get; set; }
    [Required] public int third_id { get; set; }
}

public class IntOptionalIntRequestDTO
{
    [Required] public int id { get; set; }
    public int? second_id { get; set; }
}

public class OptionalIntOptionalIntRequestDTO
{
    public int? id { get; set; }
    public int? second_id { get; set; }
}

public class IntIntTitleRequestDTO
{
    public int id { get; set; }
    public int second_id { get; set; }
    public string? title { get; set; } = null;
}

public class IntTitleRequestDTO
{
    [Required] public string title { get; set; }
    [Required] public int id { get; set; }
}

public class OptionalIntTitleRequestDTO
{
    public string? title { get; set; }
    public int id { get; set; }
}

public class OptionalIntOptionalTitleRequestDTO
{
    public string? title { get; set; }
    public int? id { get; set; }
}

public class OptionalTitleOptionalTitleRequestDTO
{
    public string? title { get; set; }
    public string? second_title { get; set; }
}

public class GuidIntRequestDTO
{
    public Guid id { get; set; }
    public int value { get; set; }
}

public class GuidIntTitleRequestDTO
{
    public Guid? id { get; set; }
    public int value { get; set; }
    public string? title { get; set; }
}

public class GuidIntBoolRequestDTO
{
    public Guid Id { get; set; }
    public int Title { get; set; }
    public bool Flag { get; set; }
}

public class GuidIntIntRequestDTO
{
    public Guid Id { get; set; }
    public int Title { get; set; }
    public int SecondTitle { get; set; }
}

public class LongTitleRequestDTO
{
    public long value { get; set; }
    public string title { get; set; }
}

public class BoolRequestDTO
{
    [Required] public bool flag { get; set; }
}

public class OptionalBoolRequestDTO
{
    public bool? flag { get; set; }
}

// public class BoolResponseDTO : ResultSet<bool>
// {
//     public BoolResponseDTO(bool data)
//     {
//         this.data = data;
//     }
//
//     public BoolResponseDTO()
//     {
//             
//     }
// }
public class DateRequestDTO
{
    public DateTime? date { get; set; }
}

public class DateRequestNotOptionalDTO
{
    public DateTime date { get; set; }
}

public class IdBoolRequestDTO
{
    [Required] public Guid id { get; set; }
    [Required] public bool flag { get; set; }
}

public class TitleBoolRequestDTO
{
    [Required] public string title { get; set; }
    [Required] public bool flag { get; set; }
}

public class TitleOptionalBoolRequestDTO
{
    [Required] public string title { get; set; }
    public bool? flag { get; set; }
}

public class IdNullBoolRequestDTO
{
    public Guid? Id { get; set; }
    [Required] public bool Flag { get; set; }
}

// public class IdResponseDTO : ResultSet<Guid>
// {
//     public IdResponseDTO(Guid data)
//     {
//         this.data = data;
//     }
// }
// public class ListIdResponseDTO : ResultSet<List<Guid>>
// {
//     public ListIdResponseDTO(List<Guid> data)
//     {
//         this.data = data;
//     }
// }
// public class IdNullResponseDTO : ResultSet<Guid?>
// {
//     public IdNullResponseDTO(Guid? data)
//     {
//         this.data = data;
//     }
// }