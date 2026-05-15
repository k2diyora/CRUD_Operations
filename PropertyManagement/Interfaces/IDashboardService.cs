public interface IDashboardService
{
    Task<DashboardSummary> GetSummaryAsync(int userId);
}
