namespace RosterApi.Contracts.Stores;

public class UpdateStoreRequest
{
    public string Name { get; set; } = string.Empty;

    public string Location { get; set; } = string.Empty;
}