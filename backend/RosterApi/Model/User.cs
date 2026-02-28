namespace RosterApi.Models;

public class User{
  public Guid Id {get;set;} = Guid.NewGuid();
  public string Email {get;set;} = string.Empty;
  public string Role {get;set;} = "Employee";
  public DateTime CreatedAtUtc { get;set;} = DateTime.UtcNow;
} 