using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RosterApi.Migrations
{
    /// <inheritdoc />
    public partial class updateAvailbility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AvailabilitySubmissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RosterWeekId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StoreId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvailabilitySubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvailabilitySubmissions_RosterWeeks_RosterWeekId",
                        column: x => x.RosterWeekId,
                        principalTable: "RosterWeeks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AvailabilitySubmissions_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AvailabilitySubmissions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AvailabilitySlots",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AvailabilitySubmissionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    ShiftType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SlotType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvailabilitySlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvailabilitySlots_AvailabilitySubmissions_AvailabilitySubmissionId",
                        column: x => x.AvailabilitySubmissionId,
                        principalTable: "AvailabilitySubmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AvailabilitySlots_AvailabilitySubmissionId",
                table: "AvailabilitySlots",
                column: "AvailabilitySubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_AvailabilitySubmissions_RosterWeekId",
                table: "AvailabilitySubmissions",
                column: "RosterWeekId");

            migrationBuilder.CreateIndex(
                name: "IX_AvailabilitySubmissions_StoreId",
                table: "AvailabilitySubmissions",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_AvailabilitySubmissions_UserId_RosterWeekId",
                table: "AvailabilitySubmissions",
                columns: new[] { "UserId", "RosterWeekId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AvailabilitySlots");

            migrationBuilder.DropTable(
                name: "AvailabilitySubmissions");
        }
    }
}
