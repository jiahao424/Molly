using System.ComponentModel.DataAnnotations;

namespace RosterApi.Contracts.Auth;

public class RegisterRequest
{
    [Required]
    [EmailAddress]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$",
    ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, and one number.")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MinLength(2)]
    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;
}