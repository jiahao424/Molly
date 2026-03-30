namespace RosterApi.Contracts.AvailabilitySubmissions;

public class AvailabilitySubmissionResponse
{
    public Guid Id { get; set; }

    public Guid RosterWeekId { get; set; }

    public Guid StoreId { get; set; }

    public Guid UserId { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? Note { get; set; }

    public DateTime? SubmittedAtUtc { get; set; }

    public DateTime UpdatedAtUtc { get; set; }

    public List<AvailabilitySlotResponse> Slots { get; set; } = new();
}