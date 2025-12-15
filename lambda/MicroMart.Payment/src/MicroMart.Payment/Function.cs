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
    private const string STRIPE_WEBHOOK_SECRET = "whsec_MLrUCz5PSbnyQxFpSRUFP6GVV8izzhYx"; // Updated from Stripe Dashboard
    
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

            // Get user context from authorizer
            var userId = request.RequestContext.Authorizer?.Lambda?.ContainsKey("userId") == true
                ? request.RequestContext.Authorizer.Lambda["userId"]?.ToString()
                : null;

            context.Logger.LogInformation($"Request userId from authorizer: {userId ?? "NULL"}");

            // POST /payment/create-checkout - Create Stripe checkout session (REQUIRES AUTH)
            if (method == "POST" && path == "/payment/create-checkout")
            {
                if (string.IsNullOrEmpty(userId))
                {
                    context.Logger.LogWarning("Create checkout attempted without authentication");
                    return CreateResponse(401, new { error = "Authentication required to create checkout" });
                }
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

            // GET /admin/orders - Get all orders (ADMIN only)
            if (method == "GET" && path == "/admin/orders")
            {
                return await GetAllOrders(userId, context);
            }

            // PUT /orders/{orderId}/status - Update order status (ADMIN only)
            if (method == "PUT" && path.StartsWith("/orders/") && path.EndsWith("/status"))
            {
                var pathParts = path.Split('/');
                if (pathParts.Length == 4)
                {
                    var orderId = pathParts[2];
                    return await UpdateOrderStatus(request, orderId, userId, context);
                }
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
                    { "userId", userId }, // Authenticated user ID (no longer "guest")
                    { "productId", checkoutRequest.ProductId },
                    { "quantity", quantity.ToString() }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            context.Logger.LogInformation($"Checkout session created: {session.Id} for user: {userId}");
            context.Logger.LogInformation("Order will be created only after successful payment via webhook");

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
                
                // Verify payment was actually successful
                if (session.PaymentStatus != "paid")
                {
                    context.Logger.LogWarning($"Session {session.Id} completed but payment status is {session.PaymentStatus}");
                    return CreateResponse(200, new { received = true, message = "Payment not completed" });
                }
                
                var ordersTable = Table.LoadTable(_dynamoClient, ORDERS_TABLE);
                
                // Check if order already exists (to handle webhook retries)
                var search = ordersTable.Scan(new ScanFilter());
                var allOrders = await search.GetRemainingAsync();
                var existingOrder = allOrders.FirstOrDefault(doc => 
                    doc.ContainsKey("stripeSessionId") && 
                    doc["stripeSessionId"] != null &&
                    doc["stripeSessionId"].AsString() == session.Id);

                if (existingOrder != null)
                {
                    context.Logger.LogInformation($"Order already exists for session {session.Id}, skipping creation (webhook retry)");
                    return CreateResponse(200, new { received = true, message = "Order already exists" });
                }
                
                // Create new order ONLY when payment succeeds
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
                        ["orderStatus"] = "processing",
                        ["stripeSessionId"] = session.Id,
                        ["createdAt"] = DateTime.UtcNow.ToString("o"),
                        ["paidAt"] = DateTime.UtcNow.ToString("o")
                    };

                    await ordersTable.PutItemAsync(order);
                    context.Logger.LogInformation($"✅ Order created successfully: {order["orderId"]} for completed payment");
                }
                else
                {
                    context.Logger.LogError($"Cannot create order - incomplete metadata for session {session.Id}");
                    return CreateResponse(400, new { error = "Incomplete order data" });
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
            // Validate userId - must be authenticated to view orders
            if (string.IsNullOrEmpty(userId))
            {
                context.Logger.LogWarning("Attempt to fetch orders without authentication");
                return CreateResponse(401, new { error = "Authentication required" });
            }

            context.Logger.LogInformation($"Fetching orders for user: {userId}");

            var table = Table.LoadTable(_dynamoClient, ORDERS_TABLE);
            
            var search = table.Scan(new ScanFilter());
            var allOrders = await search.GetRemainingAsync();
            
            // Filter to only show THIS user's orders
            var userOrders = allOrders
                .Where(doc => doc.ContainsKey("userId") && doc["userId"].AsString() == userId)
                .Select(doc => new
                {
                    orderId = doc["orderId"].AsString(),
                    userId = doc["userId"].AsString(),
                    productId = doc["productId"].AsString(),
                    quantity = doc["quantity"].AsInt(),
                    totalAmount = doc["totalAmount"].AsDecimal(),
                    paymentStatus = doc["paymentStatus"].AsString(),
                    orderStatus = doc.ContainsKey("orderStatus") ? doc["orderStatus"].AsString() : "processing",
                    createdAt = doc["createdAt"].AsString(),
                    paidAt = doc.ContainsKey("paidAt") ? doc["paidAt"].AsString() : null,
                    stripeSessionId = doc.ContainsKey("stripeSessionId") ? doc["stripeSessionId"].AsString() : null
                })
                .OrderByDescending(o => o.createdAt)
                .ToList();

            context.Logger.LogInformation($"Found {userOrders.Count} orders for user {userId}");

            return CreateResponse(200, new { 
                orders = userOrders,
                userId = userId,
                totalOrders = userOrders.Count
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error fetching orders for user {userId}: {ex.Message}");
            return CreateResponse(500, new { error = "Failed to fetch orders" });
        }
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> GetAllOrders(
        string userId,
        ILambdaContext context)
    {
        try
        {
            // TODO: Add proper admin role check here
            if (string.IsNullOrEmpty(userId))
            {
                context.Logger.LogWarning("Get all orders attempted without authentication");
                return CreateResponse(401, new { error = "Authentication required" });
            }

            var table = Table.LoadTable(_dynamoClient, ORDERS_TABLE);
            
            var search = table.Scan(new ScanFilter());
            var allOrders = await search.GetRemainingAsync();
            
            // Return ALL orders (not filtered by userId)
            var orders = allOrders
                .Select(doc => new
                {
                    orderId = doc["orderId"].AsString(),
                    userId = doc["userId"].AsString(),
                    productId = doc["productId"].AsString(),
                    quantity = doc["quantity"].AsInt(),
                    totalAmount = doc["totalAmount"].AsDecimal(),
                    paymentStatus = doc["paymentStatus"].AsString(),
                    orderStatus = doc.ContainsKey("orderStatus") ? doc["orderStatus"].AsString() : "processing",
                    createdAt = doc["createdAt"].AsString(),
                    paidAt = doc.ContainsKey("paidAt") ? doc["paidAt"].AsString() : null,
                    stripeSessionId = doc.ContainsKey("stripeSessionId") ? doc["stripeSessionId"].AsString() : null
                })
                .OrderByDescending(o => o.createdAt)
                .ToList();

            context.Logger.LogInformation($"Admin {userId} fetched {orders.Count} total orders");

            return CreateResponse(200, new { 
                orders = orders,
                totalOrders = orders.Count
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error fetching all orders: {ex.Message}");
            return CreateResponse(500, new { error = "Failed to fetch all orders" });
        }
    }

    private async Task<APIGatewayHttpApiV2ProxyResponse> UpdateOrderStatus(
        APIGatewayHttpApiV2ProxyRequest request,
        string orderId,
        string userId,
        ILambdaContext context)
    {
        try
        {
            // TODO: Add admin role check here
            if (string.IsNullOrEmpty(userId))
            {
                context.Logger.LogWarning("Update order status attempted without authentication");
                return CreateResponse(401, new { error = "Authentication required" });
            }

            var updateRequest = JsonSerializer.Deserialize<UpdateOrderStatusRequest>(
                request.Body,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            if (string.IsNullOrEmpty(updateRequest?.Status))
            {
                return CreateResponse(400, new { error = "Status is required" });
            }

            // Validate status
            var validStatuses = new[] { "processing", "shipped", "delivered", "cancelled" };
            if (!validStatuses.Contains(updateRequest.Status.ToLower()))
            {
                return CreateResponse(400, new { error = "Invalid status. Must be: processing, shipped, delivered, or cancelled" });
            }

            var ordersTable = Table.LoadTable(_dynamoClient, ORDERS_TABLE);
            
            // Find the order
            var search = ordersTable.Scan(new ScanFilter());
            var allOrders = await search.GetRemainingAsync();
            var order = allOrders.FirstOrDefault(doc => 
                doc.ContainsKey("orderId") && 
                doc["orderId"].AsString() == orderId);

            if (order == null)
            {
                context.Logger.LogWarning($"Order not found: {orderId}");
                return CreateResponse(404, new { error = "Order not found" });
            }

            // Update order status
            order["orderStatus"] = updateRequest.Status.ToLower();
            order["updatedAt"] = DateTime.UtcNow.ToString("o");
            
            await ordersTable.PutItemAsync(order);
            
            context.Logger.LogInformation($"✅ Order {orderId} status updated to {updateRequest.Status} by user {userId}");

            return CreateResponse(200, new { 
                message = "Order status updated successfully",
                orderId = orderId,
                newStatus = updateRequest.Status.ToLower()
            });
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error updating order status for order {orderId}: {ex.Message}");
            return CreateResponse(500, new { error = "Failed to update order status" });
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

public class UpdateOrderStatusRequest
{
    public string Status { get; set; }
}