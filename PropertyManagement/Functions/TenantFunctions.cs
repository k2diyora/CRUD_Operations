using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using System.Text.Json;

public class TenantFunctions
{
    private readonly ITenantService _service;

    public TenantFunctions(ITenantService service)
    {
        _service = service;
    }

    [Function("GetTenants")]
    public async Task<HttpResponseData> GetTenants(
        [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequestData req)
    {
        var tenants = await _service.GetAllAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(tenants);
        return response;
    }

    [Function("CreateTenant")]
    public async Task<HttpResponseData> CreateTenant(
        [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req)
    {
        try
        {
            var body = await new StreamReader(req.Body).ReadToEndAsync();
            var dto = JsonSerializer.Deserialize<CreateTenantDto>(
                body,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            if (dto is null)
            {
                var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequest.WriteStringAsync("Invalid request body");
                return badRequest;
            }

            await _service.CreateAsync(dto);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("Created");
            return response;
        }
        catch (Exception ex)
        {
            var response = req.CreateResponse(HttpStatusCode.BadRequest);
            await response.WriteStringAsync(ex.Message);
            return response;
        }
    }

    [Function("UpdateTenant")]
    public async Task<HttpResponseData> UpdateTenant(
        [HttpTrigger(AuthorizationLevel.Function, "put")] HttpRequestData req)
    {
        try
        {
            var body = await new StreamReader(req.Body).ReadToEndAsync();
            var dto = JsonSerializer.Deserialize<UpdateTenantDto>(
                body,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

            if (dto is null)
            {
                var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequest.WriteStringAsync("Invalid request body");
                return badRequest;
            }

            await _service.UpdateAsync(dto);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("Updated");
            return response;
        }
        catch (Exception ex)
        {
            var response = req.CreateResponse(HttpStatusCode.BadRequest);
            await response.WriteStringAsync(ex.Message);
            return response;
        }
    }

    [Function("DeleteTenant")]
    public async Task<HttpResponseData> DeleteTenant(
        [HttpTrigger(AuthorizationLevel.Function, "delete")] HttpRequestData req)
    {
        try
        {
            var id = TryGetIdFromQuery(req);
            if (!id.HasValue)
            {
                var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
                await badRequest.WriteStringAsync("Query parameter 'id' is required");
                return badRequest;
            }

            await _service.DeleteAsync(id.Value);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteStringAsync("Deleted");
            return response;
        }
        catch (Exception ex)
        {
            var response = req.CreateResponse(HttpStatusCode.BadRequest);
            await response.WriteStringAsync(ex.Message);
            return response;
        }
    }

    private static int? TryGetIdFromQuery(HttpRequestData req)
    {
        var query = req.Url.Query;
        if (string.IsNullOrWhiteSpace(query))
            return null;

        foreach (var segment in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = segment.Split('=', 2);
            if (parts.Length == 2 && parts[0].Equals("id", StringComparison.OrdinalIgnoreCase))
            {
                var value = Uri.UnescapeDataString(parts[1]);
                if (int.TryParse(value, out var id))
                    return id;
            }
        }

        return null;
    }
}
