public interface IPropertyService
{
    Task<IEnumerable<Property>> GetAllAsync();
    Task CreateAsync(CreatePropertyDto dto);
    Task UpdateAsync(UpdatePropertyDto dto);
    Task DeleteAsync(int id);
}
