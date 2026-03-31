namespace RosterApi.Contracts.AvailabilitySubmissions;

public class RosterWeekAvailabilityDayResponse
{
    public DateOnly Date { get; set; }
    public string AvailableShiftType { get; set; } = "None";
    public string PreferredShiftType { get; set; } = "None";
    public string? Note { get; set; }
}