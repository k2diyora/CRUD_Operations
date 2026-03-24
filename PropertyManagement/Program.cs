using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Data.SqlClient;
using System.Data;

var builder = FunctionsApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("local.settings.json", optional: true, reloadOnChange: true);

var sqlConnectionString =
    Environment.GetEnvironmentVariable("SqlConnectionString")
    ?? builder.Configuration["SqlConnectionString"]
    ?? builder.Configuration["Values:SqlConnectionString"]
    ?? builder.Configuration.GetConnectionString("SqlConnectionString");

builder.Services.AddScoped<IDbConnection>(_ =>
{
    if (string.IsNullOrWhiteSpace(sqlConnectionString))
    {
        throw new InvalidOperationException(
            "SqlConnectionString is missing. Configure it in Azure Function App settings.");
    }

    return new SqlConnection(sqlConnectionString);
});

builder.Services.AddScoped<IPropertyRepository, PropertyRepository>();
builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<ITenantRepository, TenantRepository>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Build().Run();
