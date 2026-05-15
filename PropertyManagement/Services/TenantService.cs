using Dapper;
using System.Data;

public class TenantService : ITenantService
{
    private readonly IDbConnection _db;

    public TenantService(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Tenant>> GetAllAsync(int userId)
    {
        return await _db.QueryAsync<Tenant>("SELECT * FROM Tenant WHERE UserId = @UserId", new { UserId = userId });
    }

    public async Task CreateAsync(CreateTenantDto dto, int userId)
    {
        TenantValidator.Validate(dto);

        var tenant = new Tenant
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            PropertyId = dto.PropertyId,
            UserId = userId
        };

        var sql = @"INSERT INTO Tenant (Name, Email, Phone, PropertyId, UserId)
                    VALUES (@Name, @Email, @Phone, @PropertyId, @UserId)";

        await _db.ExecuteAsync(sql, tenant);
    }

    public async Task UpdateAsync(UpdateTenantDto dto, int userId)
    {
        TenantValidator.Validate(dto);

        var existing = await _db.QuerySingleOrDefaultAsync<Tenant>(
            "SELECT * FROM Tenant WHERE Id = @Id AND UserId = @UserId",
            new { dto.Id, UserId = userId });
        if (existing is null)
            throw new Exception($"Tenant with Id {dto.Id} not found");

        var tenant = new Tenant
        {
            Id = dto.Id,
            Name = dto.Name ?? existing.Name,
            Email = dto.Email ?? existing.Email,
            Phone = dto.Phone ?? existing.Phone,
            PropertyId = dto.PropertyId ?? existing.PropertyId,
            UserId = userId
        };

        var sql = @"UPDATE Tenant
                    SET Name = @Name,
                        Email = @Email,
                        Phone = @Phone,
                        PropertyId = @PropertyId
                    WHERE Id = @Id AND UserId = @UserId";

        await _db.ExecuteAsync(sql, tenant);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        if (id <= 0)
            throw new Exception("Id must be greater than 0");

        await _db.ExecuteAsync("DELETE FROM Tenant WHERE Id = @Id AND UserId = @UserId", new { Id = id, UserId = userId });
    }
}
