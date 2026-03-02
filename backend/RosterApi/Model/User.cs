namespace RosterApi.Models;

public class User{
  public Guid Id {get;set;} = Guid.NewGuid();
  public string FullName { get; set; } = string.Empty;
  public string Email {get;set;} = string.Empty;
  public string PasswordHash {get;set;} = string.Empty;
  public string Role {get;set;} = "Employee";
  public DateTime CreatedAtUtc { get;set;} = DateTime.UtcNow;
  public bool EmailConfirmed { get; set; } = false;
  public string? EmailVerificationToken { get; set; }
  public DateTime? EmailVerificationTokenExpiresAtUtc { get; set; }
} 