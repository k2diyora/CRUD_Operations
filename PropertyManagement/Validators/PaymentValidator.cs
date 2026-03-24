public static class PaymentValidator
{
    public static void Validate(CreatePaymentDto dto)
    {
        if (dto == null)
            throw new Exception("Request body is required");

        if (dto.TenantId <= 0)
            throw new Exception("TenantId must be greater than 0");

        if (dto.Amount <= 0)
            throw new Exception("Amount must be greater than 0");

        if (string.IsNullOrWhiteSpace(dto.Status))
            throw new Exception("Payment status is required");
    }

    public static void Validate(UpdatePaymentDto dto)
    {
        if (dto == null)
            throw new Exception("Request body is required");

        if (dto.Id <= 0)
            throw new Exception("Id must be greater than 0");

        if (dto.TenantId.HasValue && dto.TenantId.Value <= 0)
            throw new Exception("TenantId must be greater than 0");

        if (dto.Amount.HasValue && dto.Amount.Value <= 0)
            throw new Exception("Amount must be greater than 0");

        if (dto.Status is not null && string.IsNullOrWhiteSpace(dto.Status))
            throw new Exception("Payment status cannot be empty");
    }
}
