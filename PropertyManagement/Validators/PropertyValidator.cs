public static class PropertyValidator
{
    public static void Validate(CreatePropertyDto dto)
    {
        if (dto == null)
            throw new Exception("Request body is required");

        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new Exception("Property name is required");

        if (dto.RentAmount <= 0)
            throw new Exception("Rent must be greater than 0");
    }

    public static void Validate(UpdatePropertyDto dto)
    {
        if (dto == null)
            throw new Exception("Request body is required");

        if (dto.Id <= 0)
            throw new Exception("Id must be greater than 0");

        if (dto.Name is not null && string.IsNullOrWhiteSpace(dto.Name))
            throw new Exception("Property name cannot be empty");

        if (dto.RentAmount.HasValue && dto.RentAmount.Value <= 0)
            throw new Exception("Rent must be greater than 0");
    }
}