namespace RosterApi.Models;

public class AvailabilitySlot
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AvailabilitySubmissionId { get; set; }
    public AvailabilitySubmission AvailabilitySubmission { get; set; } = null!;

    public DateOnly Date { get; set; }

    // Morning / Evening / HalfDay / FullDay
    public string ShiftType { get; set; } = "Morning";

    // Available / Preferred
    public string SlotType { get; set; } = "Available";

    public string? Note { get; set; }
}