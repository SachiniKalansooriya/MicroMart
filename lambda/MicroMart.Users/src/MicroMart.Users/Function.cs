using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using System.Text.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MicroMart.Users;

public class Function
{
    private readonly IAmazonDynamoDB _dynamoClient;
    private const string USERS_TABLE = "MicroMart-Users";

    public Function()
    {
        _dynamoClient = new AmazonDynamoDBClient();
    }

    public async Task<APIGatewayHttpApiV2ProxyResponse> FunctionHandler(
        APIGatewayHttpApiV2ProxyRequest request, 
        ILambdaContext context)
    {
        try
        {
            var method = request.RequestContext.Http.Method;
            var path = request.RequestContext.Http.Path;

            // Remove stage name if present
            if (path.StartsWith("/prod"))
            {
                path = path.Substring(5);
            }
            else if (path.StartsWith("/dev"))
            {
                path = path.Substring(4);
            }

            context.Logger.LogInformation($"Method: {method}, Path: {path}");

            // Extract userId from authorizer context
            string? userId = null;
            if (request.RequestContext?.Authorizer?.Lambda?.ContainsKey("userId") == true)
            {
                userId = request.RequestContext.Authorizer.Lambda["userId"]?.ToString();
                context.Logger.LogInformation($"Request userId from authorizer: {userId}");
            }

            // GET /admin/users - Get all users (ADMIN only)
            if (method == "GET" && path == "/admin/users")
            {
                return await GetAllUsers(context);
            }

            // GET /users/{userId} - Get user by ID
            if (method == "GET" && path.StartsWith("/users/"))
            {
                var userIdFromPath = path.Split('/')[2];
                return await GetUserById(userIdFromPath, context);
            }

            return CreateResponse(404, new { error = "Route not found" });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            context.Logger.LogError($"Stack trace: {ex.StackTrace}");
            return CreateResponse(500, new { error = "Internal server error", details = ex.Message });
        }
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> GetAllUsers(ILambdaContext context)
    {
        try
        {
            var usersTable = Table.LoadTable(_dynamoClient, USERS_TABLE);
            var scanFilter = new ScanFilter();
            var search = usersTable.Scan(scanFilter);
            
            var users = new List<object>();
            do
            {
                var documents = await search.GetNextSetAsync();
                foreach (var doc in documents)
                {
                    users.Add(new
                    {
                        userId = doc["userId"].AsString(),
                        name = doc["name"].AsString(),
                        email = doc["email"].AsString(),
                        role = doc["role"].AsString(),
                        createdAt = doc.ContainsKey("createdAt") ? doc["createdAt"].AsString() : null
                    });
                }
            } while (!search.IsDone);

            context.Logger.LogInformation($"Fetched {users.Count} users");

            return CreateResponse(200, new { users });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error fetching all users: {ex.Message}");
            context.Logger.LogError($"Stack trace: {ex.StackTrace}");
            return CreateResponse(500, new { error = "Failed to fetch users", details = ex.Message });
        }
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> GetUserById(string userId, ILambdaContext context)
    {
        try
        {
            var usersTable = Table.LoadTable(_dynamoClient, USERS_TABLE);
            var user = await usersTable.GetItemAsync(userId);

            if (user == null)
            {
                return CreateResponse(404, new { error = "User not found" });
            }

            return CreateResponse(200, new
            {
                userId = user["userId"].AsString(),
                name = user["name"].AsString(),
                email = user["email"].AsString(),
                role = user["role"].AsString(),
                createdAt = user.ContainsKey("createdAt") ? user["createdAt"].AsString() : null
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error fetching user {userId}: {ex.Message}");
            return CreateResponse(500, new { error = "Failed to fetch user" });
        }
    }

    private APIGatewayHttpApiV2ProxyResponse CreateResponse(int statusCode, object body)
    {
        return new APIGatewayHttpApiV2ProxyResponse
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
