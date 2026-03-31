using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RosterApi.Contracts.AvailabilitySubmissions;
using RosterApi.Data;
using RosterApi.Models;

namespace RosterApi.Controllers;

[ApiController]
[Route("api/roster-weeks/{rosterWeekId:guid}/availability-submission")]
public class AvailabilitySubmissionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AvailabilitySubmissionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Authorize(Roles = "Employee")]
    public async Task<ActionResult<AvailabilitySubmissionResponse>> GetMyAvailability(Guid rosterWeekId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized("Invalid user identity.");
        }

        var submission = await _db.AvailabilitySubmissions
            .Include(a => a.Slots)
            .FirstOrDefaultAsync(a =>
                a.RosterWeekId == rosterWeekId &&
                a.UserId == userId.Value);

        if (submission == null)
        {
            return NotFound("No availability submission found for this roster week.");
        }

        return Ok(MapToResponse(submission));
    }

    [HttpPut]
    [Authorize(Roles = "Employee")]
    public async Task<ActionResult<AvailabilitySubmissionResponse>> UpsertMyAvailability(
        Guid rosterWeekId,
        [FromBody] SubmitAvailabilityRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized("Invalid user identity.");
        }

        var rosterWeek = await _db.RosterWeeks
            .FirstOrDefaultAsync(rw => rw.Id == rosterWeekId);

        if (rosterWeek == null)
        {
            return NotFound("Roster week not found.");
        }

        var userBelongsToStore = await _db.Users
            .Where(u => u.Id == userId.Value)
            .AnyAsync(u => u.Stores.Any(s => s.Id == rosterWeek.StoreId));

        if (!userBelongsToStore)
        {
            return Forbid();
        }

        if (rosterWeek.Status != "CollectingAvailability")
        {
            return BadRequest("This roster week is not accepting availability submissions.");
        }

        if (DateTime.UtcNow > rosterWeek.AvailabilityCloseAtUtc)
        {
            return BadRequest("Availability submission deadline has passed.");
        }

        if (request.Slots == null || request.Slots.Count == 0)
        {
            return BadRequest("At least one day is required.");
        }
        
        var duplicateDates = request.Slots
            .GroupBy(d => d.Date)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicateDates.Count > 0)
        {
            return BadRequest("Duplicate dates are not allowed in the same submission.");
        }

        foreach (var day in request.Slots)
        {
            if (day.Date < rosterWeek.WeekStartDate || day.Date > rosterWeek.WeekEndDate)
            {
                return BadRequest("Day date must be within the roster week.");
            }

            if (!IsValidAvailableShiftType(day.AvailableShiftType))
            {
                return BadRequest($"Invalid available shift type: {day.AvailableShiftType}");
            }

            if (!IsValidPreferredShiftType(day.PreferredShiftType))
            {
                return BadRequest($"Invalid preferred shift type: {day.PreferredShiftType}");
            }

            var validationError = ValidatePreferredRules(day);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }
        }

        var nowUtc = DateTime.UtcNow;

        var existingSubmission = await _db.AvailabilitySubmissions
            .Include(a => a.Slots)
            .FirstOrDefaultAsync(a =>
                a.RosterWeekId == rosterWeekId &&
                a.UserId == userId.Value);

        var newSlots = BuildSlotsFromDays(request.Slots);

        if (existingSubmission == null)
        {
            var newSubmission = new AvailabilitySubmission
            {
                RosterWeekId = rosterWeek.Id,
                StoreId = rosterWeek.StoreId,
                UserId = userId.Value,
                Status = "Submitted",
                Note = request.Note,
                SubmittedAtUtc = nowUtc,
                UpdatedAtUtc = nowUtc,
                Slots = newSlots
            };

            _db.AvailabilitySubmissions.Add(newSubmission);
            await _db.SaveChangesAsync();

            return Ok(MapToResponse(newSubmission));
        }

        await using var transaction = await _db.Database.BeginTransactionAsync();

        _db.AvailabilitySlots.RemoveRange(existingSubmission.Slots);

        existingSubmission.Note = request.Note;
        existingSubmission.Status = "Submitted";
        existingSubmission.SubmittedAtUtc = nowUtc;
        existingSubmission.UpdatedAtUtc = nowUtc;

        foreach (var slot in newSlots)
        {
            slot.AvailabilitySubmissionId = existingSubmission.Id;
        }

        _db.AvailabilitySlots.AddRange(newSlots);

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        existingSubmission.Slots = newSlots;

        return Ok(MapToResponse(existingSubmission));
    }

    private Guid? GetCurrentUserId()
    {
        var userIdValue =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return null;
        }

        return userId;
    }

    private static bool IsValidAvailableShiftType(string shiftType)
    {
        return shiftType is "None" or "Morning" or "Evening" or "HalfDay" or "FullDay";
    }

    private static bool IsValidPreferredShiftType(string shiftType)
    {
        return shiftType is "None" or "Morning" or "Evening" or "FullDay";
    }

    private static string? ValidatePreferredRules(AvailabilitySlotRequest day)
    {
        if (day.AvailableShiftType == "None")
        {
            return day.PreferredShiftType == "None"
                ? null
                : "Preferred shift type must be None when availability is None.";
        }

        if (day.AvailableShiftType == "Morning")
        {
            return day.PreferredShiftType == "None"
                ? null
                : "Preferred shift type must be None when availability is Morning.";
        }

        if (day.AvailableShiftType == "Evening")
        {
            return day.PreferredShiftType == "None"
                ? null
                : "Preferred shift type must be None when availability is Evening.";
        }

        if (day.AvailableShiftType == "HalfDay")
        {
            return day.PreferredShiftType is "None" or "Morning" or "Evening"
                ? null
                : "Preferred shift type can only be None, Morning, or Evening when availability is HalfDay.";
        }

        if (day.AvailableShiftType == "FullDay")
        {
            return day.PreferredShiftType is "None" or "Morning" or "Evening" or "FullDay"
                ? null
                : "Preferred shift type can only be None, Morning, Evening, or FullDay when availability is FullDay.";
        }

        return "Invalid available shift type.";
    }

    private static List<AvailabilitySlot> BuildSlotsFromDays(List<AvailabilitySlotRequest> days)
    {
        var slots = new List<AvailabilitySlot>();

        foreach (var day in days)
        {
            if (day.AvailableShiftType != "None")
            {
                slots.Add(new AvailabilitySlot
                {
                    Date = day.Date,
                    ShiftType = day.AvailableShiftType,
                    SlotType = "Available",
                    Note = day.Note
                });
            }

            if (day.PreferredShiftType != "None")
            {
                slots.Add(new AvailabilitySlot
                {
                    Date = day.Date,
                    ShiftType = day.PreferredShiftType,
                    SlotType = "Preferred",
                    Note = day.Note
                });
            }
        }

        return slots;
    }

    private static AvailabilitySubmissionResponse MapToResponse(AvailabilitySubmission submission)
    {
        var groupedDays = submission.Slots
            .GroupBy(s => s.Date)
            .Select(group =>
            {
                var availableSlot = group.FirstOrDefault(s => s.SlotType == "Available");
                var preferredSlot = group.FirstOrDefault(s => s.SlotType == "Preferred");

                return new AvailabilitySlotResponse
                {
                    Date = group.Key,
                    AvailableShiftType = availableSlot?.ShiftType ?? "None",
                    PreferredShiftType = preferredSlot?.ShiftType ?? "None",
                    Note = availableSlot?.Note ?? preferredSlot?.Note
                };
            })
            .OrderBy(d => d.Date)
            .ToList();

        return new AvailabilitySubmissionResponse
        {
            Id = submission.Id,
            RosterWeekId = submission.RosterWeekId,
            StoreId = submission.StoreId,
            UserId = submission.UserId,
            Status = submission.Status,
            Note = submission.Note,
            SubmittedAtUtc = submission.SubmittedAtUtc,
            UpdatedAtUtc = submission.UpdatedAtUtc,
            Slots = groupedDays
        };
    }

    [HttpGet("/api/stores/{storeId:guid}/roster-weeks/{rosterWeekId:guid}/availability-submissions")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<List<RosterWeekAvailabilitySubmissionResponse>>> GetRosterWeekAvailabilitySubmissions(
        Guid storeId,
        Guid rosterWeekId)
    {
        var rosterWeek = await _db.RosterWeeks
            .FirstOrDefaultAsync(rw => rw.Id == rosterWeekId && rw.StoreId == storeId);

        if (rosterWeek == null)
        {
            return NotFound("Roster week not found.");
        }

        var submissions = await _db.AvailabilitySubmissions
            .Include(a => a.Slots)
            .Include(a => a.User)
            .Where(a => a.StoreId == storeId && a.RosterWeekId == rosterWeekId)
            .OrderBy(a => a.User.FullName)
            .ToListAsync();

        var response = submissions.Select(submission => new RosterWeekAvailabilitySubmissionResponse
        {
            Id = submission.Id,
            UserId = submission.UserId,
            UserName = submission.User.FullName,
            UserEmail = submission.User.Email,
            StoreId = submission.StoreId,
            RosterWeekId = submission.RosterWeekId,
            Status = submission.Status,
            Note = submission.Note,
            SubmittedAtUtc = submission.SubmittedAtUtc,
            UpdatedAtUtc = submission.UpdatedAtUtc,
            Days = submission.Slots
                .GroupBy(s => s.Date)
                .Select(group =>
                {
                    var availableSlot = group.FirstOrDefault(s => s.SlotType == "Available");
                    var preferredSlot = group.FirstOrDefault(s => s.SlotType == "Preferred");

                    return new RosterWeekAvailabilityDayResponse
                    {
                        Date = group.Key,
                        AvailableShiftType = availableSlot?.ShiftType ?? "None",
                        PreferredShiftType = preferredSlot?.ShiftType ?? "None",
                        Note = availableSlot?.Note ?? preferredSlot?.Note
                    };
                })
                .OrderBy(x => x.Date)
                .ToList()
        }).ToList();

        return Ok(response);
    }
}
