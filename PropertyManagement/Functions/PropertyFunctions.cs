using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[Authorize]
[ApiController]
[Route("api")]
public class PropertyFunctions : ControllerBase
{
    private readonly IPropertyService _service;

    public PropertyFunctions(IPropertyService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("GetProperties")]
    public async Task<IActionResult> GetProperties()
    {
        try
        {
            var properties = await _service.GetAllAsync(GetUserId());
            return Ok(properties);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("CreateProperty")]
    public async Task<IActionResult> CreateProperty([FromBody] CreatePropertyDto dto)
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

    [HttpPut("UpdateProperty")]
    public async Task<IActionResult> UpdateProperty([FromBody] UpdatePropertyDto dto)
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

    [HttpDelete("DeleteProperty")]
    public async Task<IActionResult> DeleteProperty([FromQuery] int? id)
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