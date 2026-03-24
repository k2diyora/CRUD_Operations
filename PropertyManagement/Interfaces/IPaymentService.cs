public interface IPaymentService
{
    Task<IEnumerable<Payment>> GetAllAsync();
    Task CreateAsync(CreatePaymentDto dto);
    Task UpdateAsync(UpdatePaymentDto dto);
    Task DeleteAsync(int id);
}
