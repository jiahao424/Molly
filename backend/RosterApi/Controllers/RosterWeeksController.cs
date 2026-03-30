using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RosterApi.Contracts.RosterWeeks;
using RosterApi.Data;
using RosterApi.Models;
using System.Security.Claims;

namespace RosterApi.Controllers;

[ApiController]
[Route("api/stores/{storeId:guid}/roster-weeks")]
public class RosterWeeksController : ControllerBase
{
    private readonly AppDbContext _db;

    public RosterWeeksController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("next")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<RosterWeekResponse>> CreateNextRosterWeek(
        Guid storeId,
        [FromBody] CreateNextRosterWeekRequest? request)
    {
        var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
        if (store == null)
        {
            return NotFound("Store not found.");
        }

        var sydTimeZone = TimeZoneInfo.FindSystemTimeZoneById("AUS Eastern Standard Time");
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, sydTimeZone);
        var todayLocal = DateOnly.FromDateTime(nowLocal);
        var nextWeekStartDate = GetNextMonday(todayLocal);
        var nextWeekEndDate = nextWeekStartDate.AddDays(6);

        var existingRosterWeek = await _db.RosterWeeks
            .FirstOrDefaultAsync(rw =>
                rw.StoreId == storeId &&
                rw.WeekStartDate == nextWeekStartDate);

        if (existingRosterWeek != null)
        {
            return Conflict("Next week's roster week already exists for this store.");
        }

        var nowUtc = DateTime.UtcNow;
        var availabilityCloseAtUtc = request?.AvailabilityCloseAtUtc ?? nowUtc.AddDays(2);

        if (availabilityCloseAtUtc <= nowUtc)
        {
            return BadRequest("Availability close time must be later than now.");
        }

        var rosterWeek = new RosterWeek
        {
            StoreId = storeId,
            WeekStartDate = nextWeekStartDate,
            WeekEndDate = nextWeekEndDate,
            Status = "CollectingAvailability",
            AvailabilityOpenAtUtc = nowUtc,
            AvailabilityCloseAtUtc = availabilityCloseAtUtc,
            PublishedAtUtc = null,
            CreatedAtUtc = nowUtc,
            UpdatedAtUtc = nowUtc
        };

        _db.RosterWeeks.Add(rosterWeek);
        await _db.SaveChangesAsync();

        return Ok(MapToResponse(rosterWeek));
    }

    [HttpGet]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<List<RosterWeekResponse>>> GetRosterWeeks(Guid storeId)
    {
        var storeExists = await _db.Stores.AnyAsync(s => s.Id == storeId);
        if (!storeExists)
        {
            return NotFound("Store not found.");
        }

        var rosterWeeks = await _db.RosterWeeks
            .Where(rw => rw.StoreId == storeId)
            .OrderByDescending(rw => rw.WeekStartDate)
            .ToListAsync();

        var response = rosterWeeks
            .Select(MapToResponse)
            .ToList();

        return Ok(response);
    }

    [HttpGet("/api/my/roster-weeks/open")]
    [Authorize(Roles = "Employee")]
    public async Task<ActionResult<List<OpenRosterWeekItemResponse>>> GetMyOpenRosterWeeks()
    {
        var userIdValue =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized("Invalid user identity.");
        }

        var nowUtc = DateTime.UtcNow;

        var rosterWeeks = await _db.RosterWeeks
            .Include(rw => rw.Store)
            .Where(rw =>
                rw.Status == "CollectingAvailability" &&
                rw.AvailabilityCloseAtUtc > nowUtc &&
                rw.Store.Users.Any(u => u.Id == userId))
            .OrderBy(rw => rw.WeekStartDate)
            .ToListAsync();

        var rosterWeekIds = rosterWeeks.Select(rw => rw.Id).ToList();

        var submittedRosterWeekIds = await _db.AvailabilitySubmissions
            .Where(a => a.UserId == userId && rosterWeekIds.Contains(a.RosterWeekId))
            .Select(a => a.RosterWeekId)
            .Distinct()
            .ToListAsync();

        var response = rosterWeeks.Select(rw => new OpenRosterWeekItemResponse
        {
            RosterWeekId = rw.Id,
            StoreId = rw.StoreId,
            StoreName = rw.Store.Name,
            StoreLocation = rw.Store.Location,
            WeekStartDate = rw.WeekStartDate,
            WeekEndDate = rw.WeekEndDate,
            Status = rw.Status,
            AvailabilityOpenAtUtc = rw.AvailabilityOpenAtUtc,
            AvailabilityCloseAtUtc = rw.AvailabilityCloseAtUtc,
            HasSubmission = submittedRosterWeekIds.Contains(rw.Id)
        }).ToList();

        return Ok(response);
    }

    [HttpGet("{rosterWeekId:guid}")]
    [Authorize(Roles = "Employee,Manager")]
    public async Task<ActionResult<RosterWeekDetailResponse>> GetRosterWeekDetail(
        Guid storeId,
        Guid rosterWeekId)
    {
        var rosterWeek = await _db.RosterWeeks
            .Include(rw => rw.Store)
            .FirstOrDefaultAsync(rw =>
                rw.Id == rosterWeekId &&
                rw.StoreId == storeId);

        if (rosterWeek == null)
        {
            return NotFound("Roster week not found.");
        }

        return Ok(new RosterWeekDetailResponse
        {
            Id = rosterWeek.Id,
            StoreId = rosterWeek.StoreId,
            StoreName = rosterWeek.Store.Name,
            StoreLocation = rosterWeek.Store.Location,
            WeekStartDate = rosterWeek.WeekStartDate,
            WeekEndDate = rosterWeek.WeekEndDate,
            Status = rosterWeek.Status,
            AvailabilityOpenAtUtc = rosterWeek.AvailabilityOpenAtUtc,
            AvailabilityCloseAtUtc = rosterWeek.AvailabilityCloseAtUtc,
            PublishedAtUtc = rosterWeek.PublishedAtUtc,
            CreatedAtUtc = rosterWeek.CreatedAtUtc,
            UpdatedAtUtc = rosterWeek.UpdatedAtUtc
        });
    }

    private static RosterWeekResponse MapToResponse(RosterWeek rosterWeek)
    {
        return new RosterWeekResponse
        {
            Id = rosterWeek.Id,
            StoreId = rosterWeek.StoreId,
            WeekStartDate = rosterWeek.WeekStartDate,
            WeekEndDate = rosterWeek.WeekEndDate,
            Status = rosterWeek.Status,
            AvailabilityOpenAtUtc = rosterWeek.AvailabilityOpenAtUtc,
            AvailabilityCloseAtUtc = rosterWeek.AvailabilityCloseAtUtc,
            PublishedAtUtc = rosterWeek.PublishedAtUtc,
            CreatedAtUtc = rosterWeek.CreatedAtUtc,
            UpdatedAtUtc = rosterWeek.UpdatedAtUtc
        };
    }

    private static DateOnly GetNextMonday(DateOnly date)
    {
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)date.DayOfWeek + 7) % 7;

        if (daysUntilMonday == 0)
        {
            daysUntilMonday = 7;
        }

        return date.AddDays(daysUntilMonday);
    }
}