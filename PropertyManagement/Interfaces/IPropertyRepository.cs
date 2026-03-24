public interface IPropertyRepository
{
    Task<IEnumerable<Property>> GetAllAsync();
    Task<Property?> GetByIdAsync(int id);
    Task CreateAsync(Property property);
    Task UpdateAsync(Property property);
    Task DeleteAsync(int id);
}