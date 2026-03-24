public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _repo;

    public PaymentService(IPaymentRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<Payment>> GetAllAsync()
    {
        return await _repo.GetAllAsync();
    }

    public async Task CreateAsync(CreatePaymentDto dto)
    {
        PaymentValidator.Validate(dto);

        var payment = new Payment
        {
            TenantId = dto.TenantId,
            Amount = dto.Amount,
            Status = dto.Status
        };

        await _repo.CreateAsync(payment);
    }

    public async Task UpdateAsync(UpdatePaymentDto dto)
    {
        PaymentValidator.Validate(dto);

        var existing = await _repo.GetByIdAsync(dto.Id);
        if (existing is null)
            throw new Exception($"Payment with Id {dto.Id} not found");

        var payment = new Payment
        {
            Id = dto.Id,
            TenantId = dto.TenantId ?? existing.TenantId,
            Amount = dto.Amount ?? existing.Amount,
            PaymentDate = dto.PaymentDate ?? existing.PaymentDate,
            Status = dto.Status ?? existing.Status
        };

        await _repo.UpdateAsync(payment);
    }

    public async Task DeleteAsync(int id)
    {
        if (id <= 0)
            throw new Exception("Id must be greater than 0");

        await _repo.DeleteAsync(id);
    }
}
