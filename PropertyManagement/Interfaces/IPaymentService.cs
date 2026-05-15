public interface IPaymentService
{
    Task<IEnumerable<Payment>> GetAllAsync(int userId);
    Task CreateAsync(CreatePaymentDto dto, int userId);
    Task UpdateAsync(UpdatePaymentDto dto, int userId);
    Task DeleteAsync(int id, int userId);
}
