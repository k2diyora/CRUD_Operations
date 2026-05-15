using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Dapper;
using System.Data;

namespace PropertyManagement.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IDbConnection _db;

        public AuthController(IConfiguration configuration, IDbConnection db)
        {
            _configuration = configuration;
            _db = db;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Username and password are required.");
            }

            var userExists = await _db.ExecuteScalarAsync<bool>(
                "SELECT CAST(COUNT(1) AS BIT) FROM Users WHERE Username = @Username",
                new { request.Username });

            if (userExists)
            {
                return Conflict("Username already exists.");
            }

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            
            await _db.ExecuteAsync(
                "INSERT INTO Users (Username, PasswordHash) VALUES (@Username, @PasswordHash)",
                new { request.Username, PasswordHash = passwordHash });

            return Ok(new { message = "Registration successful" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _db.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT Id, Username, PasswordHash FROM Users WHERE Username = @Username",
                new { request.Username });

            if (user != null && BCrypt.Net.BCrypt.Verify(request.Password, (string)user.PasswordHash))
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "super_secret_key_that_is_long_enough_for_hmacsha256");
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, (string)user.Username)
                    }),
                    Expires = DateTime.UtcNow.AddHours(1),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                    Issuer = _configuration["Jwt:Issuer"] ?? "PropertyManagement",
                    Audience = _configuration["Jwt:Audience"] ?? "PropertyManagementFront"
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                var refreshDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                        new Claim(ClaimTypes.Name, (string)user.Username),
                        new Claim("token_type", "refresh")
                    }),
                    Expires = DateTime.UtcNow.AddDays(7),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                    Issuer = _configuration["Jwt:Issuer"] ?? "PropertyManagement",
                    Audience = _configuration["Jwt:Audience"] ?? "PropertyManagementFront"
                };
                var refreshToken = tokenHandler.CreateToken(refreshDescriptor);
                var refreshTokenString = tokenHandler.WriteToken(refreshToken);

                return Ok(new { token = tokenString, refreshToken = refreshTokenString });
            }

            return Unauthorized("Invalid credentials");
        }

        [HttpPost("refresh")]
        public IActionResult Refresh([FromBody] RefreshRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest("Invalid token");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "super_secret_key_that_is_long_enough_for_hmacsha256");

            try
            {
                var principal = tokenHandler.ValidateToken(request.RefreshToken, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? "PropertyManagement",
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"] ?? "PropertyManagementFront",
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out _);

                if (!principal.HasClaim(c => c.Type == "token_type" && c.Value == "refresh"))
                {
                    return Unauthorized("Invalid refresh token");
                }

                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var username = principal.FindFirst(ClaimTypes.Name)?.Value;

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId ?? ""),
                        new Claim(ClaimTypes.Name, username ?? "")
                    }),
                    Expires = DateTime.UtcNow.AddHours(1),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                    Issuer = _configuration["Jwt:Issuer"] ?? "PropertyManagement",
                    Audience = _configuration["Jwt:Audience"] ?? "PropertyManagementFront"
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                var refreshDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId ?? ""),
                        new Claim(ClaimTypes.Name, username ?? ""),
                        new Claim("token_type", "refresh")
                    }),
                    Expires = DateTime.UtcNow.AddDays(7),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                    Issuer = _configuration["Jwt:Issuer"] ?? "PropertyManagement",
                    Audience = _configuration["Jwt:Audience"] ?? "PropertyManagementFront"
                };
                var newRefreshToken = tokenHandler.CreateToken(refreshDescriptor);
                var newRefreshTokenString = tokenHandler.WriteToken(newRefreshToken);

                return Ok(new { token = tokenString, refreshToken = newRefreshTokenString });
            }
            catch
            {
                return Unauthorized("Invalid or expired refresh token");
            }
        }
    }

    public class RefreshRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
