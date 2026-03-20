using Microsoft.EntityFrameworkCore;
using RosterApi.Models;

namespace RosterApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Store> Stores => Set<Store>();

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
    }
}