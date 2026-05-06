using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MicroMart.Auth.Login;

public class Function
{
    private readonly IAmazonDynamoDB _dynamoClient;
    private const string TABLE_NAME = "MicroMart-Users";
    private const string JWT_SECRET = "MicroMart-Super-Secret-Key-Min-32-Characters-Required-2024";

    public Function()
    {
        _dynamoClient = new AmazonDynamoDBClient();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(
        APIGatewayProxyRequest request,
        ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Login request received");

            var loginRequest = JsonSerializer.Deserialize<LoginRequest>(
                request.Body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (string.IsNullOrEmpty(loginRequest?.Email) ||
                string.IsNullOrEmpty(loginRequest?.Password))
            {
                return CreateResponse(400, new { error = "Email and password required" });
            }

            var table = Table.LoadTable(_dynamoClient, TABLE_NAME);
            
            var search = table.Query(new QueryOperationConfig
            {
                IndexName = "EmailIndex",
                KeyExpression = new Expression
                {
                    ExpressionStatement = "email = :email",
                    ExpressionAttributeValues = new Dictionary<string, DynamoDBEntry>
                    {
                        { ":email", loginRequest.Email.ToLower() }
                    }
                }
            });

            var users = await search.GetRemainingAsync();
            if (!users.Any())
            {
                return CreateResponse(401, new { error = "Invalid credentials" });
            }

            var user = users.First();

            if (!user["isActive"].AsBoolean())
            {
                return CreateResponse(403, new { error = "Account is deactivated" });
            }

            bool isValidPassword = BCrypt.Net.BCrypt.Verify(
                loginRequest.Password,
                user["password"].AsString()
            );

            if (!isValidPassword)
            {
                return CreateResponse(401, new { error = "Invalid credentials" });
            }

            var token = GenerateJwtToken(
                user["userId"].AsString(),
                user["email"].AsString(),
                user["role"].AsString()
            );

            context.Logger.LogInformation($"User logged in: {user["userId"].AsString()}");

            var userResponse = new
            {
                userId = user["userId"].AsString(),
                email = user["email"].AsString(),
                name = user["name"].AsString(),
                phone = user.Contains("phone") ? user["phone"].AsString() : "",
                address = user.Contains("address") ? user["address"].AsString() : "",
                role = user["role"].AsString(),
                createdAt = user["createdAt"].AsString()
            };

            return CreateResponse(200, new
            {
                message = "Login successful",
                token,
                user = userResponse
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return CreateResponse(500, new { error = "Internal server error" });
        }
    }

    private string GenerateJwtToken(string userId, string email, string role)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(JWT_SECRET);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("userId", userId),
                new Claim("email", email),
                new Claim("role", role)
            }),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private APIGatewayProxyResponse CreateResponse(int statusCode, object body)
    {
        return new APIGatewayProxyResponse
        {
            StatusCode = statusCode,
            Headers = new Dictionary<string, string>
            {
                { "Content-Type", "application/json" },
                { "Access-Control-Allow-Origin", "*" },
                { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
                { "Access-Control-Allow-Methods", "OPTIONS,POST,GET,PUT,DELETE" }
            },
            Body = JsonSerializer.Serialize(body)
        };
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}