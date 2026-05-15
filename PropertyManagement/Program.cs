using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("local.settings.json", optional: true, reloadOnChange: true);

var sqlConnectionString =
    builder.Configuration["SqlConnectionString"]
    ?? builder.Configuration["Values:SqlConnectionString"]
    ?? builder.Configuration.GetConnectionString("SqlConnectionString")
    ?? Environment.GetEnvironmentVariable("SqlConnectionString");

builder.Services.AddScoped<IDbConnection>(_ =>
{
    if (string.IsNullOrWhiteSpace(sqlConnectionString))
    {
        throw new InvalidOperationException(
            "SqlConnectionString is missing. Configure it in app settings or local.settings.json.");
    }

    return new SqlConnection(sqlConnectionString);
});

builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "PropertyManagement",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "PropertyManagementFront",
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "super_secret_key_that_is_long_enough_for_hmacsha256"))
    };
});
builder.Services.AddAuthorization();

builder.Services.AddControllers();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.ContentType = "application/json";

        var exceptionFeature = context.Features.Get<IExceptionHandlerFeature>();
        var exception = exceptionFeature?.Error;

        if (exception is SqlException sqlException &&
            sqlException.Number == 40615)
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Database connection failed. Verify Azure SQL firewall rules and credentials.",
                detail = "Add your client IP in Azure SQL Server Networking > Firewall rules, then retry."
            });
            return;
        }

        if (exception is SqlException loginException && loginException.Number == 18456)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Database login failed.",
                detail = "Verify SqlConnectionString User ID and Password in your configuration."
            });
            return;
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await context.Response.WriteAsJsonAsync(new
        {
            message = "An unexpected server error occurred.",
            detail = exception?.Message
        });
    });
});

app.MapControllers();

app.Run();
