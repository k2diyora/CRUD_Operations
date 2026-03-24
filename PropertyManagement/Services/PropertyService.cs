public class PropertyService : IPropertyService
{
    private readonly IPropertyRepository _repo;

    public PropertyService(IPropertyRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<Property>> GetAllAsync()
    {
        return await _repo.GetAllAsync();
    }

    public async Task CreateAsync(CreatePropertyDto dto)
    {
        PropertyValidator.Validate(dto);

        var property = new Property
        {
            Name = dto.Name,
            Address = dto.Address,
            City = dto.City,
            PostalCode = dto.PostalCode,
            RentAmount = dto.RentAmount,
            CreatedDate = GetTorontoNow()
        };

        await _repo.CreateAsync(property);
    }

    public async Task UpdateAsync(UpdatePropertyDto dto)
    {
        PropertyValidator.Validate(dto);

        var existing = await _repo.GetByIdAsync(dto.Id);
        if (existing is null)
            throw new Exception($"Property with Id {dto.Id} not found");

        var property = new Property
        {
            Id = dto.Id,
            Name = dto.Name ?? existing.Name,
            Address = dto.Address ?? existing.Address,
            City = dto.City ?? existing.City,
            PostalCode = dto.PostalCode ?? existing.PostalCode,
            RentAmount = dto.RentAmount ?? existing.RentAmount
        };

        await _repo.UpdateAsync(property);
    }

    public async Task DeleteAsync(int id)
    {
        if (id <= 0)
            throw new Exception("Id must be greater than 0");

        await _repo.DeleteAsync(id);
    }

    private static DateTime GetTorontoNow()
    {
        var tzId = OperatingSystem.IsWindows() ? "Eastern Standard Time" : "America/Toronto";
        var tz = TimeZoneInfo.FindSystemTimeZoneById(tzId);
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
    }
}