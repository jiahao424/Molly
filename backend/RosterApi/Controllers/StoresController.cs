using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RosterApi.Contracts.Stores;
using RosterApi.Data;
using RosterApi.Models;

namespace RosterApi.Controllers;

[ApiController]
[Route("api/stores")]
[Authorize(Roles = "Manager")]
public class StoresController : ControllerBase
{
    private readonly AppDbContext _db;

    public StoresController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StoreResponse>>> GetAll()
    {
        var stores = await _db.Stores
            .OrderByDescending(s => s.CreatedAtUtc)
            .Select(s => new StoreResponse
            {
                Id = s.Id,
                Name = s.Name,
                Location = s.Location,
                Status = s.Status,
                CreatedAtUtc = s.CreatedAtUtc,
                UpdatedAtUtc = s.UpdatedAtUtc
            })
            .ToListAsync();

        return Ok(stores);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StoreResponse>> GetById(Guid id)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id);

        if (store == null)
            return NotFound();

        var response = new StoreResponse
        {
            Id = store.Id,
            Name = store.Name,
            Location = store.Location,
            Status = store.Status,
            CreatedAtUtc = store.CreatedAtUtc,
            UpdatedAtUtc = store.UpdatedAtUtc
        };

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<StoreResponse>> Create(CreateStoreRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Store name is required.");

        if (string.IsNullOrWhiteSpace(request.Location))
            return BadRequest("Store location is required.");

        var store = new Store
        {
            Name = request.Name.Trim(),
            Location = request.Location.Trim(),
            Status = "Setup",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.Stores.Add(store);
        await _db.SaveChangesAsync();

        var response = new StoreResponse
        {
            Id = store.Id,
            Name = store.Name,
            Location = store.Location,
            Status = store.Status,
            CreatedAtUtc = store.CreatedAtUtc,
            UpdatedAtUtc = store.UpdatedAtUtc
        };

        return CreatedAtAction(nameof(GetById), new { id = store.Id }, response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id);

        if (store == null)
            return NotFound();

        _db.Stores.Remove(store);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<StoreResponse>> Update(Guid id, UpdateStoreRequest request)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == id);

        if (store == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Store name is required.");

        if (string.IsNullOrWhiteSpace(request.Location))
            return BadRequest("Store location is required.");

        store.Name = request.Name.Trim();
        store.Location = request.Location.Trim();
        store.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var response = new StoreResponse
        {
            Id = store.Id,
            Name = store.Name,
            Location = store.Location,
            Status = store.Status,
            CreatedAtUtc = store.CreatedAtUtc,
            UpdatedAtUtc = store.UpdatedAtUtc
        };

        return Ok(response);
    }
}