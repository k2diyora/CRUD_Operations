public interface ITenantService
{
    Task<IEnumerable<Tenant>> GetAllAsync(int userId);
    Task CreateAsync(CreateTenantDto dto, int userId);
    Task UpdateAsync(UpdateTenantDto dto, int userId);
    Task DeleteAsync(int id, int userId);
}
