using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using System.Text.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MicroMart.Products;

public class Function
{
    private readonly IAmazonDynamoDB _dynamoClient;
    private const string TABLE_NAME = "MicroMart-Products";

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
            context.Logger.LogInformation($"Request: {request.RequestContext.Http.Method} {request.RawPath}");

            // Get user context from authorizer
            var userRole = request.RequestContext.Authorizer?.Lambda?.ContainsKey("role") == true
                ? request.RequestContext.Authorizer.Lambda["role"]?.ToString()
                : null;

            var userId = request.RequestContext.Authorizer?.Lambda?.ContainsKey("userId") == true
                ? request.RequestContext.Authorizer.Lambda["userId"]?.ToString()
                : null;

            context.Logger.LogInformation($"User Role: {userRole}, User ID: {userId}");

            var method = request.RequestContext.Http.Method;
            var path = request.RawPath ?? request.RequestContext.Http.Path;
            
            // Remove stage name if present (e.g., /prod/products -> /products)
            if (path.StartsWith("/prod/"))
            {
                path = path.Substring(5); // Remove "/prod"
            }
            
            context.Logger.LogInformation($"Processed path: {path}");

            // GET /products - All authenticated users
            if (method == "GET" && path == "/products")
            {
                return await GetAllProducts(context);
            }

            // POST /products - Admin only
            if (method == "POST" && path == "/products")
            {
                if (userRole != "admin")
                {
                    return CreateResponse(403, new { error = "Admin access required" });
                }
                return await CreateProduct(request, userId, context);
            }

            // PUT /products/{id} - Admin only
            if (method == "PUT" && path.StartsWith("/products/"))
            {
                if (userRole != "admin")
                {
                    return CreateResponse(403, new { error = "Admin access required" });
                }
                var productId = path.Split('/')[2];
                return await UpdateProduct(productId, request, context);
            }

            // DELETE /products/{id} - Admin only
            if (method == "DELETE" && path.StartsWith("/products/"))
            {
                if (userRole != "admin")
                {
                    return CreateResponse(403, new { error = "Admin access required" });
                }
                var productId = path.Split('/')[2];
                return await DeleteProduct(productId, context);
            }

            return CreateResponse(404, new { error = "Route not found" });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return CreateResponse(500, new { error = "Internal server error" });
        }
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> GetAllProducts(ILambdaContext context)
    {
        var table = Table.LoadTable(_dynamoClient, TABLE_NAME);
        var search = table.Scan(new ScanFilter());
        var products = await search.GetRemainingAsync();

        var productList = products.Select(doc => new
        {
            productId = doc["productId"].AsString(),
            name = doc.ContainsKey("name") ? doc["name"].AsString() : "",
            price = doc.ContainsKey("price") ? doc["price"].AsDecimal() : 0,
            description = doc.ContainsKey("description") ? doc["description"].AsString() : "",
            category = doc.ContainsKey("category") ? doc["category"].AsString() : "",
            stock = doc.ContainsKey("stock") ? doc["stock"].AsInt() : 0,
            createdAt = doc.ContainsKey("createdAt") ? doc["createdAt"].AsString() : ""
        }).ToList();

        return CreateResponse(200, new { products = productList });
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> CreateProduct(
        APIGatewayHttpApiV2ProxyRequest request,
        string userId,
        ILambdaContext context)
    {
        var productRequest = JsonSerializer.Deserialize<ProductRequest>(
            request.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        if (string.IsNullOrEmpty(productRequest?.Name) || productRequest.Price <= 0)
        {
            return CreateResponse(400, new { error = "Invalid product data" });
        }

        var table = Table.LoadTable(_dynamoClient, TABLE_NAME);
        var productId = Guid.NewGuid().ToString();

        var product = new Document
        {
            ["productId"] = productId,
            ["name"] = productRequest.Name,
            ["price"] = productRequest.Price,
            ["description"] = productRequest.Description ?? "",
            ["category"] = productRequest.Category ?? "",
            ["stock"] = productRequest.Stock ?? 0,
            ["createdBy"] = userId,
            ["createdAt"] = DateTime.UtcNow.ToString("o")
        };

        await table.PutItemAsync(product);

        context.Logger.LogInformation($"Product created: {productId}");

        return CreateResponse(201, new
        {
            message = "Product created successfully",
            productId
        });
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> UpdateProduct(
        string productId,
        APIGatewayHttpApiV2ProxyRequest request,
        ILambdaContext context)
    {
        var updateRequest = JsonSerializer.Deserialize<ProductRequest>(
            request.Body,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
        );

        var table = Table.LoadTable(_dynamoClient, TABLE_NAME);
        
        var updates = new Document
        {
            ["productId"] = productId
        };

        if (!string.IsNullOrEmpty(updateRequest?.Name))
            updates["name"] = updateRequest.Name;
        if (updateRequest?.Price > 0)
            updates["price"] = updateRequest.Price;
        if (!string.IsNullOrEmpty(updateRequest?.Description))
            updates["description"] = updateRequest.Description;
        if (!string.IsNullOrEmpty(updateRequest?.Category))
            updates["category"] = updateRequest.Category;
        if (updateRequest?.Stock.HasValue == true)
            updates["stock"] = updateRequest.Stock.Value;

        updates["updatedAt"] = DateTime.UtcNow.ToString("o");

        await table.UpdateItemAsync(updates);

        context.Logger.LogInformation($"Product updated: {productId}");

        return CreateResponse(200, new { message = "Product updated successfully" });
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> DeleteProduct(
        string productId,
        ILambdaContext context)
    {
        var table = Table.LoadTable(_dynamoClient, TABLE_NAME);
        await table.DeleteItemAsync(productId);

        context.Logger.LogInformation($"Product deleted: {productId}");

        return CreateResponse(200, new { message = "Product deleted successfully" });
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

public class ProductRequest
{
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string Description { get; set; }
    public string Category { get; set; }
    public int? Stock { get; set; }
}