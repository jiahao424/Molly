namespace RosterApi.Models;

public class RosterWeek
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid StoreId { get; set; }
    public Store Store { get; set; } = null!;

    public DateOnly WeekStartDate { get; set; }
    public DateOnly WeekEndDate { get; set; }

    public string Status { get; set; } = "CollectingAvailability";

    public DateTime AvailabilityOpenAtUtc { get; set; }
    public DateTime AvailabilityCloseAtUtc { get; set; }

    public DateTime? PublishedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<AvailabilitySubmission> AvailabilitySubmissions { get; set; } = new List<AvailabilitySubmission>();
}