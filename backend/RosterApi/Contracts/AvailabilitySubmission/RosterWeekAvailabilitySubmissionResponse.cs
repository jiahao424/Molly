namespace RosterApi.Contracts.AvailabilitySubmissions;

public class RosterWeekAvailabilitySubmissionResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public Guid StoreId { get; set; }
    public Guid RosterWeekId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public List<RosterWeekAvailabilityDayResponse> Days { get; set; } = new();
}