namespace RosterApi.Models;

public class Store
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Status { get; set; } = "Setup";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
}