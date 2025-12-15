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
    private const string STRIPE_SECRET_KEY = "sk_test_51SdwrOQZz7OWMvrQEIr3yrnQHDt4A99WHrrI6QzgxctwIdzASNqO215SgAiAXFHy7WGaWZX2s2bwmFqRYBd1KKPd00cDodAiPi";
    private const string STRIPE_WEBHOOK_SECRET = "whsec_e9431075b31d9dbd636fe2aeef2ed3e02d68deb2b81b67aab1c3ae40de99beaa"; // Updated from Stripe Dashboard
    
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
            var path = request.RawPath ?? request.RequestContext.Http.Path;
            
            // Remove stage name if present (e.g., /prod/payment/create-checkout -> /payment/create-checkout)
            if (path.StartsWith("/prod/"))
            {
                path = path.Substring(5); // Remove "/prod"
            }
            
            context.Logger.LogInformation($"Method: {method}, Path: {path}");

            // Handle OPTIONS for CORS preflight
            if (method == "OPTIONS")
            {
                return CreateResponse(200, new { message = "CORS preflight" });
            }

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

            // Determine the frontend URL from the request origin or use localhost as fallback
            var origin = request.Headers?.ContainsKey("origin") == true 
                ? request.Headers["origin"] 
                : "http://localhost:5173";

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
                SuccessUrl = $"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = $"{origin}/payment/cancel",
                Metadata = new Dictionary<string, string>
                {
                    { "userId", userId ?? "guest" },
                    { "productId", checkoutRequest.ProductId },
                    { "quantity", quantity.ToString() }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            context.Logger.LogInformation($"Checkout session created: {session.Id}");

            // Create pending order immediately (will be updated to completed by webhook)
            try
            {
                var ordersTable = Table.LoadTable(_dynamoClient, ORDERS_TABLE);
                var order = new Document
                {
                    ["orderId"] = Guid.NewGuid().ToString(),
                    ["userId"] = userId ?? "guest",
                    ["productId"] = checkoutRequest.ProductId,
                    ["quantity"] = quantity,
                    ["totalAmount"] = productPrice * quantity,
                    ["paymentStatus"] = "pending",
                    ["stripeSessionId"] = session.Id,
                    ["createdAt"] = DateTime.UtcNow.ToString("o")
                };
                await ordersTable.PutItemAsync(order);
                context.Logger.LogInformation($"Pending order created: {order["orderId"]}");
            }
            catch (Exception ex)
            {
                context.Logger.LogError($"Failed to create pending order: {ex.Message}");
                // Don't fail the checkout, just log the error
            }

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
            
            if (string.IsNullOrEmpty(json))
            {
                context.Logger.LogError("Webhook body is null or empty");
                return CreateResponse(400, new { error = "Empty body" });
            }

            // Try to get stripe-signature header (may be in different formats)
            string stripeSignature = null;
            if (request.Headers != null)
            {
                if (request.Headers.ContainsKey("stripe-signature"))
                {
                    stripeSignature = request.Headers["stripe-signature"];
                }
                else if (request.Headers.ContainsKey("Stripe-Signature"))
                {
                    stripeSignature = request.Headers["Stripe-Signature"];
                }
            }

            context.Logger.LogInformation($"Webhook received. Has signature: {!string.IsNullOrEmpty(stripeSignature)}");

            Event stripeEvent;
            
            // Verify webhook signature for security
            if (!string.IsNullOrEmpty(STRIPE_WEBHOOK_SECRET) && !string.IsNullOrEmpty(stripeSignature))
            {
                try
                {
                    stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, STRIPE_WEBHOOK_SECRET);
                    context.Logger.LogInformation("Webhook signature verified");
                }
                catch (Exception ex)
                {
                    context.Logger.LogError($"Webhook signature verification failed: {ex.Message}");
                    return CreateResponse(400, new { error = "Invalid signature" });
                }
            }
            else
            {
                // For testing without webhook signature
                try
                {
                    stripeEvent = EventUtility.ParseEvent(json);
                    context.Logger.LogInformation("Webhook processed without signature verification (testing mode)");
                }
                catch (Exception ex)
                {
                    context.Logger.LogError($"Failed to parse webhook event: {ex.Message}");
                    return CreateResponse(400, new { error = "Invalid event data" });
                }
            }

            // Handle successful payment
            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Session;
                
                if (session == null)
                {
                    context.Logger.LogError("Session object is null in webhook event");
                    return CreateResponse(400, new { error = "Invalid session data" });
                }
                
                context.Logger.LogInformation($"Payment completed for session: {session.Id}");
                
                // Update existing order status from pending to completed
                var ordersTable = Table.LoadTable(_dynamoClient, ORDERS_TABLE);
                
                // Find the order by stripeSessionId
                var search = ordersTable.Scan(new ScanFilter());
                var allOrders = await search.GetRemainingAsync();
                var existingOrder = allOrders.FirstOrDefault(doc => 
                    doc.ContainsKey("stripeSessionId") && 
                    doc["stripeSessionId"] != null &&
                    doc["stripeSessionId"].AsString() == session.Id);

                if (existingOrder != null)
                {
                    // Update existing order to completed
                    existingOrder["paymentStatus"] = "completed";
                    existingOrder["paidAt"] = DateTime.UtcNow.ToString("o");
                    await ordersTable.PutItemAsync(existingOrder);
                    context.Logger.LogInformation($"Order {existingOrder["orderId"]} updated to completed");
                }
                else
                {
                    // Fallback: Create new order if not found (shouldn't happen but good safety net)
                    if (session.Metadata != null && 
                        session.Metadata.ContainsKey("userId") && 
                        session.Metadata.ContainsKey("productId") && 
                        session.Metadata.ContainsKey("quantity") &&
                        session.AmountTotal.HasValue)
                    {
                        var order = new Document
                        {
                            ["orderId"] = Guid.NewGuid().ToString(),
                            ["userId"] = session.Metadata["userId"],
                            ["productId"] = session.Metadata["productId"],
                            ["quantity"] = int.Parse(session.Metadata["quantity"]),
                            ["totalAmount"] = session.AmountTotal.Value / 100m,
                            ["paymentStatus"] = "completed",
                            ["stripeSessionId"] = session.Id,
                            ["createdAt"] = DateTime.UtcNow.ToString("o"),
                            ["paidAt"] = DateTime.UtcNow.ToString("o")
                        };

                        await ordersTable.PutItemAsync(order);
                        context.Logger.LogInformation($"New order created from webhook: {order["orderId"]}");
                    }
                    else
                    {
                        context.Logger.LogWarning($"Order not found for session {session.Id} and metadata incomplete - cannot create fallback order");
                    }
                }
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