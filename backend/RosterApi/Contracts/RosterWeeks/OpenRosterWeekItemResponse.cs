namespace RosterApi.Contracts.RosterWeeks;

public class OpenRosterWeekItemResponse
{
    public Guid RosterWeekId { get; set; }
    public Guid StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public string StoreLocation { get; set; } = string.Empty;
    public DateOnly WeekStartDate { get; set; }
    public DateOnly WeekEndDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime AvailabilityOpenAtUtc { get; set; }
    public DateTime AvailabilityCloseAtUtc { get; set; }
    public bool HasSubmission { get; set; }
}