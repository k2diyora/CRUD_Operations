using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using System.Net;
using System.Text.Json;

public class PropertyFunctions
{
    private readonly IPropertyService _service;

    public PropertyFunctions(IPropertyService service)
    {
        _service = service;
    }

    [Function("GetProperties")]
    public async Task<HttpResponseData> GetProperties(
        [HttpTrigger(AuthorizationLevel.Function, "get")] HttpRequestData req)
    {
        var properties = await _service.GetAllAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(properties);
        return response;
    }

    [Function("CreateProperty")]
    public async Task<HttpResponseData> CreateProperty(
    [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req)
    {
        try
        {
            var body = await new StreamReader(req.Body).ReadToEndAsync();

            var dto = JsonSerializer.Deserialize<CreatePropertyDto>(
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

    [Function("UpdateProperty")]
    public async Task<HttpResponseData> UpdateProperty(
        [HttpTrigger(AuthorizationLevel.Function, "put")] HttpRequestData req)
    {
        try
        {
            var body = await new StreamReader(req.Body).ReadToEndAsync();

            var dto = JsonSerializer.Deserialize<UpdatePropertyDto>(
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

    [Function("DeleteProperty")]
    public async Task<HttpResponseData> DeleteProperty(
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