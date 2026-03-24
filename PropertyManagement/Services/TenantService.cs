public class TenantService : ITenantService
{
    private readonly ITenantRepository _repo;

    public TenantService(ITenantRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<Tenant>> GetAllAsync()
    {
        return await _repo.GetAllAsync();
    }

    public async Task CreateAsync(CreateTenantDto dto)
    {
        TenantValidator.Validate(dto);

        var tenant = new Tenant
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            PropertyId = dto.PropertyId
        };

        await _repo.CreateAsync(tenant);
    }

    public async Task UpdateAsync(UpdateTenantDto dto)
    {
        TenantValidator.Validate(dto);

        var existing = await _repo.GetByIdAsync(dto.Id);
        if (existing is null)
            throw new Exception($"Tenant with Id {dto.Id} not found");

        var tenant = new Tenant
        {
            Id = dto.Id,
            Name = dto.Name ?? existing.Name,
            Email = dto.Email ?? existing.Email,
            Phone = dto.Phone ?? existing.Phone,
            PropertyId = dto.PropertyId ?? existing.PropertyId
        };

        await _repo.UpdateAsync(tenant);
    }

    public async Task DeleteAsync(int id)
    {
        if (id <= 0)
            throw new Exception("Id must be greater than 0");

        await _repo.DeleteAsync(id);
    }
}
