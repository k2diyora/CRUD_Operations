using Dapper;
using System.Data;

public class PropertyRepository : IPropertyRepository
{
    private readonly IDbConnection _db;

    public PropertyRepository(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Property>> GetAllAsync()
    {
        return await _db.QueryAsync<Property>("SELECT * FROM Property");
    }

    public async Task<Property?> GetByIdAsync(int id)
    {
        var sql = "SELECT * FROM Property WHERE Id = @Id";
        return await _db.QuerySingleOrDefaultAsync<Property>(sql, new { Id = id });
    }

    public async Task CreateAsync(Property property)
    {
        var sql = @"INSERT INTO Property (Name, Address, City, PostalCode, RentAmount, CreatedDate)
                    VALUES (@Name, @Address, @City, @PostalCode, @RentAmount, @CreatedDate)";

        await _db.ExecuteAsync(sql, property);
    }

    public async Task UpdateAsync(Property property)
    {
        var sql = @"UPDATE Property
                    SET Name = @Name,
                        Address = @Address,
                        City = @City,
                        PostalCode = @PostalCode,
                        RentAmount = @RentAmount
                    WHERE Id = @Id";

        await _db.ExecuteAsync(sql, property);
    }

    public async Task DeleteAsync(int id)
    {
        await _db.ExecuteAsync("DELETE FROM Property WHERE Id = @Id", new { Id = id });
    }
}