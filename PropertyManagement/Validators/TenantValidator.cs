public static class TenantValidator
{
    public static void Validate(CreateTenantDto dto)
    {
        if (dto == null)
            throw new Exception("Request body is required");

        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new Exception("Tenant name is required");

        if (string.IsNullOrWhiteSpace(dto.Email))
            throw new Exception("Tenant email is required");

        if (dto.PropertyId <= 0)
            throw new Exception("PropertyId must be greater than 0");
    }

    public static void Validate(UpdateTenantDto dto)
    {
        if (dto == null)
            throw new Exception("Request body is required");

        if (dto.Id <= 0)
            throw new Exception("Id must be greater than 0");

        if (dto.Name is not null && string.IsNullOrWhiteSpace(dto.Name))
            throw new Exception("Tenant name cannot be empty");

        if (dto.Email is not null && string.IsNullOrWhiteSpace(dto.Email))
            throw new Exception("Tenant email cannot be empty");

        if (dto.PropertyId.HasValue && dto.PropertyId.Value <= 0)
            throw new Exception("PropertyId must be greater than 0");
    }
}
