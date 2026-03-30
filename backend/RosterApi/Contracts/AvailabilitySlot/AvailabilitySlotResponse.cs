namespace RosterApi.Contracts.AvailabilitySubmissions;

public class AvailabilitySlotResponse
{
    public DateOnly Date { get; set; }

    // None / Morning / Evening / HalfDay / FullDay
    public string AvailableShiftType { get; set; } = "None";

    // None / Morning / Evening / FullDay
    public string PreferredShiftType { get; set; } = "None";

    public string? Note { get; set; }
}