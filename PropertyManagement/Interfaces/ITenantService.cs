public interface ITenantService
{
    Task<IEnumerable<Tenant>> GetAllAsync();
    Task CreateAsync(CreateTenantDto dto);
    Task UpdateAsync(UpdateTenantDto dto);
    Task DeleteAsync(int id);
}
