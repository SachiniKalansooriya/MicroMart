using Amazon.Lambda.Core;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MicroMart.Authorizer;

public class Function
{
    private const string JWT_SECRET = "MicroMart-Super-Secret-Key-Min-32-Characters-Required-2024";

    public AuthorizerResponse FunctionHandler(AuthorizerRequest request, ILambdaContext context)
    {
        try
        {
            context.Logger.LogInformation("Authorizer invoked");
            context.Logger.LogInformation($"Request: {JsonSerializer.Serialize(request)}");

            // Extract token from headers
            string token = null;
            
            if (request.Headers != null)
            {
                if (request.Headers.ContainsKey("authorization"))
                {
                    token = request.Headers["authorization"];
                }
                else if (request.Headers.ContainsKey("Authorization"))
                {
                    token = request.Headers["Authorization"];
                }
            }

            if (string.IsNullOrEmpty(token))
            {
                context.Logger.LogInformation("No authorization header found");
                return CreateDenyResponse();
            }

            // Remove "Bearer " prefix
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = token.Substring(7).Trim();
            }

            // Verify JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(JWT_SECRET);

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);

            // Extract claims - try different claim types
            var userId = principal.FindFirst("userId")?.Value 
                ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                ?? "";
                
            var email = principal.FindFirst("email")?.Value 
                ?? principal.FindFirst(ClaimTypes.Email)?.Value 
                ?? "";
                
            var role = principal.FindFirst("role")?.Value 
                ?? principal.FindFirst(ClaimTypes.Role)?.Value 
                ?? "";

            // Log all claims for debugging
            context.Logger.LogInformation($"All claims: {string.Join(", ", principal.Claims.Select(c => $"{c.Type}={c.Value}"))}");
            context.Logger.LogInformation($"Extracted claims - userId: '{userId}', email: '{email}', role: '{role}'");
            context.Logger.LogInformation($"Token valid - User: {userId}, Role: {role}");

            var response = CreateAllowResponse(userId, email, role);
            context.Logger.LogInformation($"Returning response: {JsonSerializer.Serialize(response)}");
            return response;
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Authorization failed: {ex.Message}");
            context.Logger.LogError($"Stack trace: {ex.StackTrace}");
            return CreateDenyResponse();
        }
    }

    private AuthorizerResponse CreateAllowResponse(string userId, string email, string role)
    {
        return new AuthorizerResponse
        {
            IsAuthorized = true,
            Context = new Dictionary<string, string>
            {
                { "userId", userId ?? "" },
                { "email", email ?? "" },
                { "role", role ?? "" }
            }
        };
    }

    private AuthorizerResponse CreateDenyResponse()
    {
        return new AuthorizerResponse
        {
            IsAuthorized = false
        };
    }
}

public class AuthorizerRequest
{
    [JsonPropertyName("headers")]
    public Dictionary<string, string> Headers { get; set; }

    [JsonPropertyName("routeArn")]
    public string RouteArn { get; set; }
}

public class AuthorizerResponse
{
    [JsonPropertyName("isAuthorized")]
    public bool IsAuthorized { get; set; }

    [JsonPropertyName("context")]
    public Dictionary<string, string> Context { get; set; }
}