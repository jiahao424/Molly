using Microsoft.EntityFrameworkCore;
using RosterApi.Models;

namespace RosterApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<RosterWeek> RosterWeeks => Set<RosterWeek>();
    public DbSet<AvailabilitySubmission> AvailabilitySubmissions => Set<AvailabilitySubmission>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasMany(u => u.Stores)
            .WithMany(s => s.Users)
            .UsingEntity<Dictionary<string, object>>(
                "UserStore",
                j => j
                    .HasOne<Store>()
                    .WithMany()
                    .HasForeignKey("StoreId"),
                j => j
                    .HasOne<User>()
                    .WithMany()
                    .HasForeignKey("UserId"),
                j =>
                {
                    j.HasKey("UserId", "StoreId");
                });

        modelBuilder.Entity<RosterWeek>()
            .HasOne(rw => rw.Store)
            .WithMany(s => s.RosterWeeks)
            .HasForeignKey(rw => rw.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RosterWeek>()
            .HasIndex(rw => new { rw.StoreId, rw.WeekStartDate })
            .IsUnique();
        
        modelBuilder.Entity<AvailabilitySubmission>()
            .HasOne(a => a.RosterWeek)
            .WithMany(rw => rw.AvailabilitySubmissions)
            .HasForeignKey(a => a.RosterWeekId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AvailabilitySubmission>()
            .HasOne(a => a.Store)
            .WithMany()
            .HasForeignKey(a => a.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AvailabilitySubmission>()
            .HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AvailabilitySubmission>()
            .HasIndex(a => new { a.UserId, a.RosterWeekId })
            .IsUnique();

        modelBuilder.Entity<AvailabilitySlot>()
            .HasOne(s => s.AvailabilitySubmission)
            .WithMany(a => a.Slots)
            .HasForeignKey(s => s.AvailabilitySubmissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}