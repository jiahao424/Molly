namespace RosterApi.Contracts.RosterWeeks;

public class RosterWeekDetailResponse
{
    public Guid Id { get; set; }
    public Guid StoreId { get; set; }

    public string StoreName { get; set; } = string.Empty;
    public string StoreLocation { get; set; } = string.Empty;

    public DateOnly WeekStartDate { get; set; }
    public DateOnly WeekEndDate { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime AvailabilityOpenAtUtc { get; set; }
    public DateTime AvailabilityCloseAtUtc { get; set; }

    public DateTime? PublishedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}