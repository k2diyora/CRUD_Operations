using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

[Authorize]
[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;

    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("GetDashboardSummary")]
    [HttpGet("summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var summary = await _service.GetSummaryAsync(GetUserId());
        return Ok(summary);
    }
}