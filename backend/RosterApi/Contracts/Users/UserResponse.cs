namespace RosterApi.Contracts.Users;

public class UserResponse
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string StaffType { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }

    public List<UserStoreResponse> Stores { get; set; } = new();
}

public class UserStoreResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
}