namespace RosterApi.Contracts.Users;

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Role { get; set; } = "Employee";

    public string StaffType { get; set; } = "Regular";

    public List<Guid> StoreIds { get; set; } = new();
}