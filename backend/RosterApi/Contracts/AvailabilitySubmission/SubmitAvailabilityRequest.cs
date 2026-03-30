namespace RosterApi.Contracts.AvailabilitySubmissions;

public class SubmitAvailabilityRequest
{
    public string? Note { get; set; }

    public List<AvailabilitySlotRequest> Slots { get; set; } = new();
}