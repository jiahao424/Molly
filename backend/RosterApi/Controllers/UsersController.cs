using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RosterApi.Contracts.Users;
using RosterApi.Data;
using RosterApi.Models;
using RosterApi.Services;

namespace RosterApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Manager")]
public class UsersController : ControllerBase
{
    private const string DefaultInitialPassword = "123456";

    private readonly AppDbContext _db;
    private readonly EmailService _emailService;
    private readonly IConfiguration _configuration;

    public UsersController(
        AppDbContext db,
        EmailService emailService,
        IConfiguration configuration)
    {
        _db = db;
        _emailService = emailService;
        _configuration = configuration;
    }


    private static string GenerateEmailVerificationToken()
    {
        return Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll()
    {
        var users = await _db.Users
            .Include(u => u.Stores)
            .ToListAsync();

        var response = users.Select(u => new UserResponse
        {
            Id = u.Id,
            Email = u.Email,
            Role = u.Role,
            StaffType = u.StaffType,
            CreatedAtUtc = u.CreatedAtUtc,
            FullName = u.FullName,
            Stores = u.Stores.Select(s => new UserStoreResponse
            {
                Id = s.Id,
                Name = s.Name,
                Location = s.Location,
                Status = s.Status
            }).ToList()
        }).ToList();

        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponse>> GetById(Guid id)
    {
        var user = await _db.Users
            .Include(u => u.Stores)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound();

        var response = new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            StaffType = user.StaffType,
            CreatedAtUtc = user.CreatedAtUtc,
            FullName = user.FullName,
            Stores = user.Stores.Select(s => new UserStoreResponse
            {
                Id = s.Id,
                Name = s.Name,
                Location = s.Location,
                Status = s.Status
            }).ToList()
        };

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<UserResponse>> Create(CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest("Full name is required.");

        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest("Email is required.");

        var passwordToUse = string.IsNullOrWhiteSpace(request.Password)
            ? DefaultInitialPassword
            : request.Password;

        var normalizedEmail = request.Email.Trim().ToLower();

        var exists = await _db.Users.AnyAsync(u => u.Email == normalizedEmail);
        if (exists)
            return Conflict("A user with this email already exists.");

        var stores = await _db.Stores
            .Where(s => request.StoreIds.Contains(s.Id))
            .ToListAsync();

        if (request.StoreIds.Any() && stores.Count != request.StoreIds.Count)
            return BadRequest("One or more store IDs are invalid.");

        var emailVerificationToken = GenerateEmailVerificationToken();

        var user = new User
        {
            Email = normalizedEmail,
            FullName = request.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordToUse),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Employee" : request.Role.Trim(),
            StaffType = string.IsNullOrWhiteSpace(request.StaffType) ? "Regular" : request.StaffType.Trim(),
            EmailConfirmed = false,
            EmailVerificationToken = emailVerificationToken,
            EmailVerificationTokenExpiresAtUtc = DateTime.UtcNow.AddHours(24),
            Stores = stores
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var verificationLink =
            $"http://localhost:5173/verify-email?email={Uri.EscapeDataString(user.Email)}&token={user.EmailVerificationToken}";

        await _emailService.SendVerificationEmailAsync(user.Email, verificationLink);

        var response = new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            StaffType = user.StaffType,
            CreatedAtUtc = user.CreatedAtUtc,
            FullName = user.FullName,
            Stores = user.Stores.Select(s => new UserStoreResponse
            {
                Id = s.Id,
                Name = s.Name,
                Location = s.Location,
                Status = s.Status
            }).ToList()
        };
      return CreatedAtAction(nameof(GetById), new { id = user.Id }, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserResponse>> Update(Guid id, UpdateUserRequest request)
    {
        var user = await _db.Users
            .Include(u => u.Stores)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest("Full name is required.");

        var stores = await _db.Stores
            .Where(s => request.StoreIds.Contains(s.Id))
            .ToListAsync();

        if (request.StoreIds.Any() && stores.Count != request.StoreIds.Count)
            return BadRequest("One or more store IDs are invalid.");

        user.FullName = request.FullName.Trim();
        user.Role = string.IsNullOrWhiteSpace(request.Role) ? "Employee" : request.Role.Trim();
        user.StaffType = string.IsNullOrWhiteSpace(request.StaffType) ? "Regular" : request.StaffType.Trim();

        user.Stores.Clear();
        foreach (var store in stores)
        {
            user.Stores.Add(store);
        }

        await _db.SaveChangesAsync();

        var response = new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            StaffType = user.StaffType,
            CreatedAtUtc = user.CreatedAtUtc,
            Stores = user.Stores.Select(s => new UserStoreResponse
            {
                Id = s.Id,
                Name = s.Name,
                Location = s.Location,
                Status = s.Status
            }).ToList()
        };
        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound();

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
