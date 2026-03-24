using Dapper;
using System.Data;

public class PaymentRepository : IPaymentRepository
{
    private readonly IDbConnection _db;

    public PaymentRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Payment>> GetAllAsync()
    {
        return await _db.QueryAsync<Payment>("SELECT * FROM Payment");
    }

    public async Task<Payment?> GetByIdAsync(int id)
    {
        return await _db.QuerySingleOrDefaultAsync<Payment>(
            "SELECT * FROM Payment WHERE Id = @Id",
            new { Id = id });
    }

    public async Task CreateAsync(Payment payment)
    {
        var sql = @"INSERT INTO Payment (TenantId, Amount, Status)
                    VALUES (@TenantId, @Amount, @Status)";

        await _db.ExecuteAsync(sql, payment);
    }

    public async Task UpdateAsync(Payment payment)
    {
        var sql = @"UPDATE Payment
                    SET TenantId = @TenantId,
                        Amount = @Amount,
                        PaymentDate = @PaymentDate,
                        Status = @Status
                    WHERE Id = @Id";

        await _db.ExecuteAsync(sql, payment);
    }

    public async Task DeleteAsync(int id)
    {
        await _db.ExecuteAsync("DELETE FROM Payment WHERE Id = @Id", new { Id = id });
    }
}
