using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace RosterApi.Services;

public class EmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public EmailService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task SendVerificationEmailAsync(string toEmail, string verificationLink)
    {
        var apiKey = _configuration["Resend:ApiKey"];
        var fromEmail = _configuration["Resend:FromEmail"];
        var fromName = _configuration["Resend:FromName"];

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Resend API key is not configured.");

        if (string.IsNullOrWhiteSpace(fromEmail))
            throw new InvalidOperationException("Resend FromEmail is not configured.");

        var payload = new
        {
            from = $"{fromName} <{fromEmail}>",
            to = new[] { toEmail },
            subject = "Verify your email",
            html = $"""
                    <h2>Verify your email</h2>
                    <p>Thanks for registering.</p>
                    <p>Please click the link below to verify your email:</p>
                    <p><a href="{verificationLink}">Verify Email</a></p>
                    <p>If you did not create this account, you can ignore this email.</p>
                    """
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Failed to send email. Status: {response.StatusCode}, Body: {body}");
        }
    }
}