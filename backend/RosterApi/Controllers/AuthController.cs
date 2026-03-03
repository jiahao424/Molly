using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RosterApi.Contracts.Auth;
using RosterApi.Data;
using RosterApi.Models;
using Microsoft.AspNetCore.Authorization;
using RosterApi.Services;

namespace RosterApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly EmailService _emailService;

    public AuthController(AppDbContext db, IConfiguration configuration, EmailService emailService)
    {
        _db = db;
        _configuration = configuration;
        _emailService = emailService;
    }
    
    private static string GenerateEmailVerificationToken()
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    }

    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(RegisterRequest request)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email);
        if (exists)
            return Conflict("A user with this email already exists.");

        var emailVerificationToken = GenerateEmailVerificationToken();
        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Employee",
            EmailConfirmed = false,
            EmailVerificationToken = emailVerificationToken,
            EmailVerificationTokenExpiresAtUtc = DateTime.UtcNow.AddHours(24)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var verificationLink =
            $"http://localhost:5173/verify-email?email={Uri.EscapeDataString(user.Email)}&token={user.EmailVerificationToken}";

        await _emailService.SendVerificationEmailAsync(user.Email, verificationLink);

        return Ok(new RegisterResponse
        {
            Message = "Registration successful. Please check your email to verify your account."
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
            return Unauthorized("Invalid email or password.");

        var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!passwordValid)
            return Unauthorized("Invalid email or password.");
        
        if (!user.EmailConfirmed)
            return Unauthorized("Please verify your email before logging in.");
        var token = GenerateJwtToken(user);

        var response = new AuthResponse
        {
            Token = token,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role
        };

        return Ok(response);
    }

    private string GenerateJwtToken(User user)
    {
        var key = _configuration["Jwt:Key"];
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException("JWT Key is not configured.");

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<CurrentUserResponse> Me()
    {
        var email = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
        var fullName = User.FindFirst(ClaimTypes.Name)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        var response = new CurrentUserResponse
        {
            Email = email,
            FullName = fullName ?? string.Empty,
            Role = role ?? string.Empty
        };

        return Ok(response);
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyEmailRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
            return BadRequest("Invalid verification request.");

        if (user.EmailConfirmed)
            return BadRequest("Email is already verified.");

        if (string.IsNullOrWhiteSpace(user.EmailVerificationToken))
            return BadRequest("Verification token is missing.");

        if (user.EmailVerificationToken != request.Token)
            return BadRequest("Invalid verification token.");

        if (user.EmailVerificationTokenExpiresAtUtc == null ||
            user.EmailVerificationTokenExpiresAtUtc < DateTime.UtcNow)
            return BadRequest("Verification token has expired.");

        user.EmailConfirmed = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiresAtUtc = null;

        await _db.SaveChangesAsync();

        return Ok(new { message = "Email verified successfully." });
    }

    [HttpPost("resend-verification-email")]
    public async Task<IActionResult> ResendVerificationEmail(ResendVerificationEmailRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            return Ok(new
            {
                message = "If the account exists and is not verified, a verification email has been sent."
            });
        }

        if (user.EmailConfirmed)
        {
            return BadRequest("Email is already verified.");
        }

        var newToken = GenerateEmailVerificationToken();

        user.EmailVerificationToken = newToken;
        user.EmailVerificationTokenExpiresAtUtc = DateTime.UtcNow.AddHours(24);

        await _db.SaveChangesAsync();

        var verificationLink =
            $"http://localhost:5173/verify-email?email={Uri.EscapeDataString(user.Email)}&token={user.EmailVerificationToken}";

        await _emailService.SendVerificationEmailAsync(user.Email, verificationLink);

        return Ok(new
        {
            message = "If the account exists and is not verified, a verification email has been sent."
        });
    }
}