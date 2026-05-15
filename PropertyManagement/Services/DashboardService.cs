public class DashboardService : IDashboardService
{
    private readonly IPropertyService _propertyService;
    private readonly ITenantService _tenantService;
    private readonly IPaymentService _paymentService;

    public DashboardService(
        IPropertyService propertyService,
        ITenantService tenantService,
        IPaymentService paymentService)
    {
        _propertyService = propertyService;
        _tenantService = tenantService;
        _paymentService = paymentService;
    }

    public async Task<DashboardSummary> GetSummaryAsync(int userId)
    {
        var properties = (await _propertyService.GetAllAsync(userId)).ToList();
        var tenants = (await _tenantService.GetAllAsync(userId)).ToList();
        var payments = (await _paymentService.GetAllAsync(userId)).ToList();

        int pendingPaymentsCount = 0;
        decimal totalPendingAmount = 0;

        foreach (var tenant in tenants)
        {
            var property = properties.FirstOrDefault(p => p.Id == tenant.PropertyId);
            if (property != null)
            {
                var tenantPayments = payments.Where(p => p.TenantId == tenant.Id && string.Equals(p.Status, "Paid", StringComparison.OrdinalIgnoreCase)).Sum(p => p.Amount);
                if (tenantPayments < property.RentAmount)
                {
                    pendingPaymentsCount++;
                    totalPendingAmount += (property.RentAmount - tenantPayments);
                }
            }
        }

        return new DashboardSummary
        {
            TotalProperties = properties.Count,
            TotalTenants = tenants.Count,
            TotalPayments = payments.Count,
            TotalRentAmount = properties.Where(p => tenants.Any(t => t.PropertyId == p.Id)).Sum(p => p.RentAmount),
            TotalPaidAmount = payments
                .Where(p => string.Equals(p.Status, "Paid", StringComparison.OrdinalIgnoreCase))
                .Sum(p => p.Amount),
            PendingPayments = pendingPaymentsCount,
            PendingAmount = totalPendingAmount
        };
    }
}
