using Dapper;
using System.Data;

public class TenantRepository : ITenantRepository
{
    private readonly IDbConnection _db;

    public TenantRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Tenant>> GetAllAsync()
    {
        return await _db.QueryAsync<Tenant>("SELECT * FROM Tenant");
    }

    public async Task<Tenant?> GetByIdAsync(int id)
    {
        return await _db.QuerySingleOrDefaultAsync<Tenant>(
            "SELECT * FROM Tenant WHERE Id = @Id",
            new { Id = id });
    }

    public async Task CreateAsync(Tenant tenant)
    {
        var sql = @"INSERT INTO Tenant (Name, Email, Phone, PropertyId)
                    VALUES (@Name, @Email, @Phone, @PropertyId)";

        await _db.ExecuteAsync(sql, tenant);
    }

    public async Task UpdateAsync(Tenant tenant)
    {
        var sql = @"UPDATE Tenant
                    SET Name = @Name,
                        Email = @Email,
                        Phone = @Phone,
                        PropertyId = @PropertyId
                    WHERE Id = @Id";

        await _db.ExecuteAsync(sql, tenant);
    }

    public async Task DeleteAsync(int id)
    {
        await _db.ExecuteAsync("DELETE FROM Tenant WHERE Id = @Id", new { Id = id });
    }
}
