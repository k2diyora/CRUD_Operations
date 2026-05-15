using Dapper;
using System.Data;

public class PaymentService : IPaymentService
{
    private readonly IDbConnection _db;

    public PaymentService(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Payment>> GetAllAsync(int userId)
    {
        return await _db.QueryAsync<Payment>("SELECT * FROM Payment WHERE UserId = @UserId", new { UserId = userId });
    }

    public async Task CreateAsync(CreatePaymentDto dto, int userId)
    {
        PaymentValidator.Validate(dto);

        var payment = new Payment
        {
            TenantId = dto.TenantId,
            Amount = dto.Amount,
            PaymentDate = DateTime.UtcNow,
            Status = dto.Status,
            UserId = userId
        };

        var sql = @"INSERT INTO Payment (TenantId, Amount, PaymentDate, Status, UserId)
                    VALUES (@TenantId, @Amount, @PaymentDate, @Status, @UserId)";

        await _db.ExecuteAsync(sql, payment);
    }

    public async Task UpdateAsync(UpdatePaymentDto dto, int userId)
    {
        PaymentValidator.Validate(dto);

        var existing = await _db.QuerySingleOrDefaultAsync<Payment>(
            "SELECT * FROM Payment WHERE Id = @Id AND UserId = @UserId",
            new { dto.Id, UserId = userId });
        if (existing is null)
            throw new Exception($"Payment with Id {dto.Id} not found");

        var payment = new Payment
        {
            Id = dto.Id,
            TenantId = dto.TenantId ?? existing.TenantId,
            Amount = dto.Amount ?? existing.Amount,
            PaymentDate = dto.PaymentDate ?? existing.PaymentDate,
            Status = dto.Status ?? existing.Status,
            UserId = userId
        };

        var sql = @"UPDATE Payment
                    SET TenantId = @TenantId,
                        Amount = @Amount,
                        PaymentDate = @PaymentDate,
                        Status = @Status
                    WHERE Id = @Id AND UserId = @UserId";

        await _db.ExecuteAsync(sql, payment);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        if (id <= 0)
            throw new Exception("Id must be greater than 0");

        await _db.ExecuteAsync("DELETE FROM Payment WHERE Id = @Id AND UserId = @UserId", new { Id = id, UserId = userId });
    }
}
