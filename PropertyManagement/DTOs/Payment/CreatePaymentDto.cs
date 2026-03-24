public class CreatePaymentDto
{
    public int TenantId { get; set; }
    public decimal Amount { get; set; }
    public string ?Status { get; set; }
}
