using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RosterApi.Contracts.Users;
using RosterApi.Data;
using RosterApi.Models;
using Microsoft.AspNetCore.Authorization;

namespace RosterApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Manager")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll()
    {
        var users = await _db.Users
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Email = u.Email,
                Role = u.Role,
                CreatedAtUtc = u.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponse>> GetById(Guid id)
    {
        var user = await _db.Users.FindAsync(id);

        if (user == null)
            return NotFound();

        var response = new UserResponse
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            CreatedAtUtc = user.CreatedAtUtc
        };

        return Ok(response);
    }
}