using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[Authorize]
[ApiController]
[Route("api")]
public class TenantFunctions : ControllerBase
{
    private readonly ITenantService _service;

    public TenantFunctions(ITenantService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("GetTenants")]
    public async Task<IActionResult> GetTenants()
    {
        var tenants = await _service.GetAllAsync(GetUserId());
        return Ok(tenants);
    }

    [HttpPost("CreateTenant")]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantDto dto)
    {
        try
        {
            if (dto is null)
            {
                return BadRequest("Invalid request body");
            }

            await _service.CreateAsync(dto, GetUserId());
            return Ok("Created");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("UpdateTenant")]
    public async Task<IActionResult> UpdateTenant([FromBody] UpdateTenantDto dto)
    {
        try
        {
            if (dto is null)
            {
                return BadRequest("Invalid request body");
            }

            await _service.UpdateAsync(dto, GetUserId());
            return Ok("Updated");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("DeleteTenant")]
    public async Task<IActionResult> DeleteTenant([FromQuery] int? id)
    {
        try
        {
            if (!id.HasValue)
            {
                return BadRequest("Query parameter 'id' is required");
            }

            await _service.DeleteAsync(id.Value, GetUserId());
            return Ok("Deleted");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
