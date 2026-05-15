public interface IPropertyService
{
    Task<IEnumerable<Property>> GetAllAsync(int userId);
    Task CreateAsync(CreatePropertyDto dto, int userId);
    Task UpdateAsync(UpdatePropertyDto dto, int userId);
    Task DeleteAsync(int id, int userId);
}
