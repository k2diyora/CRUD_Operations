using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[Authorize]
[ApiController]
[Route("api")]
public class PaymentFunctions : ControllerBase
{
    private readonly IPaymentService _service;

    public PaymentFunctions(IPaymentService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("GetPayments")]
    public async Task<IActionResult> GetPayments()
    {
        var payments = await _service.GetAllAsync(GetUserId());
        return Ok(payments);
    }

    [HttpPost("CreatePayment")]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentDto dto)
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

    [HttpPut("UpdatePayment")]
    public async Task<IActionResult> UpdatePayment([FromBody] UpdatePaymentDto dto)
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

    [HttpDelete("DeletePayment")]
    public async Task<IActionResult> DeletePayment([FromQuery] int? id)
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
