using Dapper;
using System.Data;

public class PropertyService : IPropertyService
{
    private readonly IDbConnection _db;

    public PropertyService(IDbConnection db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Property>> GetAllAsync(int userId)
    {
        return await _db.QueryAsync<Property>("SELECT * FROM Property WHERE UserId = @UserId", new { UserId = userId });
    }

    public async Task CreateAsync(CreatePropertyDto dto, int userId)
    {
        PropertyValidator.Validate(dto);

        var property = new Property
        {
            Name = dto.Name,
            Address = dto.Address,
            City = dto.City,
            PostalCode = dto.PostalCode,
            RentAmount = dto.RentAmount,
            CreatedDate = GetTorontoNow(),
            UserId = userId
        };

        var sql = @"INSERT INTO Property (Name, Address, City, PostalCode, RentAmount, CreatedDate, UserId)
                    VALUES (@Name, @Address, @City, @PostalCode, @RentAmount, @CreatedDate, @UserId)";

        await _db.ExecuteAsync(sql, property);
    }

    public async Task UpdateAsync(UpdatePropertyDto dto, int userId)
    {
        PropertyValidator.Validate(dto);

        var existing = await _db.QuerySingleOrDefaultAsync<Property>(
            "SELECT * FROM Property WHERE Id = @Id AND UserId = @UserId",
            new { dto.Id, UserId = userId });
        if (existing is null)
            throw new Exception($"Property with Id {dto.Id} not found");

        var property = new Property
        {
            Id = dto.Id,
            Name = dto.Name ?? existing.Name,
            Address = dto.Address ?? existing.Address,
            City = dto.City ?? existing.City,
            PostalCode = dto.PostalCode ?? existing.PostalCode,
            RentAmount = dto.RentAmount ?? existing.RentAmount,
            UserId = userId
        };

        var sql = @"UPDATE Property
                    SET Name = @Name,
                        Address = @Address,
                        City = @City,
                        PostalCode = @PostalCode,
                        RentAmount = @RentAmount
                    WHERE Id = @Id AND UserId = @UserId";

        await _db.ExecuteAsync(sql, property);
    }

    public async Task DeleteAsync(int id, int userId)
    {
        if (id <= 0)
            throw new Exception("Id must be greater than 0");

        await _db.ExecuteAsync("DELETE FROM Property WHERE Id = @Id AND UserId = @UserId", new { Id = id, UserId = userId });
    }

    private static DateTime GetTorontoNow()
    {
        var tzId = OperatingSystem.IsWindows() ? "Eastern Standard Time" : "America/Toronto";
        var tz = TimeZoneInfo.FindSystemTimeZoneById(tzId);
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
    }
}