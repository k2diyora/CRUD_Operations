public interface ITenantRepository
{
    Task<IEnumerable<Tenant>> GetAllAsync();
    Task<Tenant?> GetByIdAsync(int id);
    Task CreateAsync(Tenant tenant);
    Task UpdateAsync(Tenant tenant);
    Task DeleteAsync(int id);
}
