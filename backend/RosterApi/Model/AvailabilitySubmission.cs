namespace RosterApi.Models;

public class AvailabilitySubmission
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RosterWeekId { get; set; }
    public RosterWeek RosterWeek { get; set; } = null!;

    public Guid StoreId { get; set; }
    public Store Store { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Draft / Submitted
    public string Status { get; set; } = "Draft";

    public string? Note { get; set; }

    public DateTime? SubmittedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<AvailabilitySlot> Slots { get; set; } = new List<AvailabilitySlot>();
}