namespace RosterApi.Contracts.RosterWeeks;

public class RosterWeekResponse
{
    public Guid Id { get; set; }

    public Guid StoreId { get; set; }

    public DateOnly WeekStartDate { get; set; }

    public DateOnly WeekEndDate { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime AvailabilityOpenAtUtc { get; set; }

    public DateTime AvailabilityCloseAtUtc { get; set; }

    public DateTime? PublishedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }
}