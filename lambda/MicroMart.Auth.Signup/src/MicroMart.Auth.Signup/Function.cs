using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using System.Text.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MicroMart.Auth.Signup;

public class Function
{
    private readonly IAmazonDynamoDB _dynamoClient;
    private const string TABLE_NAME = "MicroMart-Users";

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
            context.Logger.LogInformation("Signup request received");

            var signupRequest = JsonSerializer.Deserialize<SignupRequest>(
                request.Body, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (string.IsNullOrEmpty(signupRequest?.Email) || 
                string.IsNullOrEmpty(signupRequest?.Password) ||
                string.IsNullOrEmpty(signupRequest?.Name))
            {
                return CreateResponse(400, new { error = "Missing required fields" });
            }

            if (!IsValidEmail(signupRequest.Email))
            {
                return CreateResponse(400, new { error = "Invalid email format" });
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
                        { ":email", signupRequest.Email.ToLower() }
                    }
                }
            });

            var existingUsers = await search.GetRemainingAsync();
            if (existingUsers.Any())
            {
                return CreateResponse(409, new { error = "User already exists" });
            }

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(signupRequest.Password);

            // Auto-assign admin role for specific email addresses
            var email = signupRequest.Email.ToLower();
            var role = email == "admin@gmail.com" || email.EndsWith("@admin.micromart.com") 
                ? "admin" 
                : "customer";

            var userId = Guid.NewGuid().ToString();
            var user = new Document
            {
                ["userId"] = userId,
                ["email"] = email,
                ["password"] = hashedPassword,
                ["name"] = signupRequest.Name,
                ["phone"] = signupRequest.Phone ?? "",
                ["role"] = role,
                ["createdAt"] = DateTime.UtcNow.ToString("o"),
                ["isActive"] = true
            };

            await table.PutItemAsync(user);

            context.Logger.LogInformation($"User created: {userId}");

            var userResponse = new
            {
                userId = user["userId"].AsString(),
                email = user["email"].AsString(),
                name = user["name"].AsString(),
                phone = user["phone"].AsString(),
                role = user["role"].AsString(),
                createdAt = user["createdAt"].AsString(),
                isActive = user["isActive"].AsBoolean()
            };

            return CreateResponse(201, new
            {
                message = "User created successfully",
                user = userResponse
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return CreateResponse(500, new { 
                error = "Internal server error", 
                details = ex.Message 
            });
        }
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
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

public class SignupRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Role { get; set; }
}