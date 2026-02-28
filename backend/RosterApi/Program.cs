using Microsoft.EntityFrameworkCore;
using RosterApi.Data;

var builder = WebApplication.CreateBuilder(args);

// Controllers (MVC)
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// (后面加) app.UseHttpsRedirection();
// (后面加) app.UseAuthentication();
// (后面加) app.UseAuthorization();

app.MapControllers();

app.Run();