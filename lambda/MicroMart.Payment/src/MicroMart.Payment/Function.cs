using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DocumentModel;
using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using System.Text.Json;
using Stripe;
using Stripe.Checkout;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MicroMart.Payment;

public class Function
{
    private readonly IAmazonDynamoDB _dynamoClient;
    private const string ORDERS_TABLE = "MicroMart-Orders";
    private const string PRODUCTS_TABLE = "MicroMart-Products";
    private const string STRIPE_SECRET_KEY = "sk_test_51SdwrbQXeqGKU49Hm4flrlPYQFJBA8pogGJZ4XtsJNLzVm3h2Zx3enlQDwGV1S2SwTL82unllvOsrxuXk7aIyMUZ00187xMPTd";
    
    public Function()
    {
        _dynamoClient = new AmazonDynamoDBClient();
        StripeConfiguration.ApiKey = STRIPE_SECRET_KEY;
    }

    public async Task<APIGatewayHttpApiV2ProxyResponse> FunctionHandler(
        APIGatewayHttpApiV2ProxyRequest request,
        ILambdaContext context)
    {
        try
        {
            var method = request.RequestContext.Http.Method;
            var path = request.RawPath;

            // Get user context
            var userId = request.RequestContext.Authorizer?.Lambda?.ContainsKey("userId") == true
                ? request.RequestContext.Authorizer.Lambda["userId"]?.ToString()
                : null;

            // POST /payment/create-checkout - Create Stripe checkout session
            if (method == "POST" && path == "/payment/create-checkout")
            {
                return await CreateCheckoutSession(request, userId, context);
            }

            // POST /payment/webhook - Stripe webhook (for payment confirmation)
            if (method == "POST" && path == "/payment/webhook")
            {
                return await HandleStripeWebhook(request, context);
            }

            // GET /orders - Get user orders
            if (method == "GET" && path == "/orders")
            {
                return await GetUserOrders(userId, context);
            }

            return CreateResponse(404, new { error = "Route not found" });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            return CreateResponse(500, new { error = "Internal server error" });
        }
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> CreateCheckoutSession(
        APIGatewayHttpApiV2ProxyRequest request,
        string userId,
        ILambdaContext context)
    {
        try
        {
            var checkoutRequest = JsonSerializer.Deserialize<CheckoutRequest>(
                request.Body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (string.IsNullOrEmpty(checkoutRequest?.ProductId))
            {
                return CreateResponse(400, new { error = "Product ID required" });
            }

            // Get product details from DynamoDB
            var productTable = Table.LoadTable(_dynamoClient, PRODUCTS_TABLE);
            var product = await productTable.GetItemAsync(checkoutRequest.ProductId);

            if (product == null)
            {
                return CreateResponse(404, new { error = "Product not found" });
            }

            var productName = product["name"].AsString();
            var productPrice = product["price"].AsDecimal();
            var quantity = checkoutRequest.Quantity ?? 1;

            // Create Stripe checkout session
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmount = (long)(productPrice * 100), // Amount in cents
                            Currency = "usd",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = productName,
                                Description = product.ContainsKey("description") 
                                    ? product["description"].AsString() 
                                    : ""
                            }
                        },
                        Quantity = quantity
                    }
                },
                Mode = "payment",
                SuccessUrl = $"https://your-frontend-url.com/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = "https://your-frontend-url.com/payment/cancel",
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId },
                    { "productId", checkoutRequest.ProductId },
                    { "quantity", quantity.ToString() }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            context.Logger.LogInformation($"Checkout session created: {session.Id}");

            return CreateResponse(200, new
            {
                sessionId = session.Id,
                url = session.Url
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error creating checkout: {ex.Message}");
            return CreateResponse(500, new { error = "Failed to create checkout session" });
        }
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> HandleStripeWebhook(
        APIGatewayHttpApiV2ProxyRequest request,
        ILambdaContext context)
    {
        try
        {
            var json = request.Body;
            var stripeEvent = EventUtility.ParseEvent(json);

            // Handle successful payment
            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Session;
                
                // Save order to DynamoDB
                var ordersTable = Table.LoadTable(_dynamoClient, ORDERS_TABLE);
                var order = new Document
                {
                    ["orderId"] = Guid.NewGuid().ToString(),
                    ["userId"] = session.Metadata["userId"],
                    ["productId"] = session.Metadata["productId"],
                    ["quantity"] = int.Parse(session.Metadata["quantity"]),
                    ["totalAmount"] = session.AmountTotal / 100m,
                    ["paymentStatus"] = "completed",
                    ["stripeSessionId"] = session.Id,
                    ["createdAt"] = DateTime.UtcNow.ToString("o")
                };

                await ordersTable.PutItemAsync(order);
                context.Logger.LogInformation($"Order created: {order["orderId"]}");
            }

            return CreateResponse(200, new { received = true });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Webhook error: {ex.Message}");
            return CreateResponse(500, new { error = "Webhook processing failed" });
        }
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> GetUserOrders(
        string userId,
        ILambdaContext context)
    {
        try
        {
            var table = Table.LoadTable(_dynamoClient, ORDERS_TABLE);
            
            var search = table.Scan(new ScanFilter());
            var allOrders = await search.GetRemainingAsync();
            
            var userOrders = allOrders
                .Where(doc => doc["userId"].AsString() == userId)
                .Select(doc => new
                {
                    orderId = doc["orderId"].AsString(),
                    productId = doc["productId"].AsString(),
                    quantity = doc["quantity"].AsInt(),
                    totalAmount = doc["totalAmount"].AsDecimal(),
                    paymentStatus = doc["paymentStatus"].AsString(),
                    createdAt = doc["createdAt"].AsString()
                })
                .ToList();

            return CreateResponse(200, new { orders = userOrders });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error fetching orders: {ex.Message}");
            return CreateResponse(500, new { error = "Failed to fetch orders" });
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

public class CheckoutRequest
{
    public string ProductId { get; set; }
    public int? Quantity { get; set; } = 1;
}