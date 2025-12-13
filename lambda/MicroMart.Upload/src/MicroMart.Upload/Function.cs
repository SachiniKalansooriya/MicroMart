using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.Core;
using Amazon.S3;
using Amazon.S3.Model;
using System.Text.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace MicroMart.Upload;

public class Function
{
    private static readonly string BucketName = Environment.GetEnvironmentVariable("BUCKET_NAME") ?? "micromart-product-images";
    private readonly IAmazonS3 _s3Client;

    public Function()
    {
        _s3Client = new AmazonS3Client();
    }

    public async Task<APIGatewayProxyResponse> FunctionHandler(APIGatewayProxyRequest request, ILambdaContext context)
    {
        var headers = new Dictionary<string, string>
        {
            { "Content-Type", "application/json" },
            { "Access-Control-Allow-Origin", "*" },
            { "Access-Control-Allow-Headers", "Content-Type,Authorization" },
            { "Access-Control-Allow-Methods", "POST,OPTIONS" }
        };

        // DETAILED DEBUG LOGGING
        context.Logger.LogInformation("========== REQUEST DEBUG START ==========");
        context.Logger.LogInformation($"Request Method: {request.HttpMethod}");
        context.Logger.LogInformation($"Request Path: {request.Path}");
        context.Logger.LogInformation($"Request Body (raw): '{request.Body}'");
        context.Logger.LogInformation($"Request Body Length: {request.Body?.Length ?? 0}");
        context.Logger.LogInformation($"Request Body IsNullOrEmpty: {string.IsNullOrEmpty(request.Body)}");
        context.Logger.LogInformation($"Request IsBase64Encoded: {request.IsBase64Encoded}");
        context.Logger.LogInformation($"Request Headers: {JsonSerializer.Serialize(request.Headers)}");
        context.Logger.LogInformation($"Request QueryStringParameters: {JsonSerializer.Serialize(request.QueryStringParameters)}");
        context.Logger.LogInformation($"Request RequestContext: {JsonSerializer.Serialize(request.RequestContext)}");
        context.Logger.LogInformation("========== REQUEST DEBUG END ==========");

        // Handle OPTIONS request
        if (request.HttpMethod == "OPTIONS")
        {
            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Headers = headers,
                Body = string.Empty
            };
        }

        try
        {
            if (string.IsNullOrEmpty(request.Body))
            {
                context.Logger.LogError("Request body is empty");
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Headers = headers,
                    Body = JsonSerializer.Serialize(new { 
                        error = "Request body is required",
                        debug = new {
                            method = request.HttpMethod,
                            path = request.Path,
                            hasBody = !string.IsNullOrEmpty(request.Body)
                        }
                    })
                };
            }

            UploadRequest? body = null;
            try
            {
                // Use case-insensitive deserialization to match camelCase from frontend
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                body = JsonSerializer.Deserialize<UploadRequest>(request.Body, options);
            }
            catch (JsonException ex)
            {
                context.Logger.LogError($"JSON deserialization error: {ex.Message}");
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Headers = headers,
                    Body = JsonSerializer.Serialize(new { 
                        error = "Invalid JSON in request body",
                        receivedBody = request.Body
                    })
                };
            }
            
            if (body == null || string.IsNullOrEmpty(body.FileName) || string.IsNullOrEmpty(body.FileType))
            {
                context.Logger.LogError($"Invalid request body. FileName: {body?.FileName}, FileType: {body?.FileType}");
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Headers = headers,
                    Body = JsonSerializer.Serialize(new { 
                        error = "fileName and fileType are required",
                        received = new {
                            fileName = body?.FileName,
                            fileType = body?.FileType
                        }
                    })
                };
            }

            context.Logger.LogInformation($"Generating presigned URL for file: {body.FileName}");

            // Generate unique file key
            var fileExtension = Path.GetExtension(body.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var key = $"products/{uniqueFileName}";

            // Generate presigned URL
            var presignedRequest = new GetPreSignedUrlRequest
            {
                BucketName = BucketName,
                Key = key,
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.AddMinutes(15),
                ContentType = body.FileType
            };

            var uploadUrl = _s3Client.GetPreSignedURL(presignedRequest);
            var fileUrl = $"https://{BucketName}.s3.eu-north-1.amazonaws.com/{key}";

            context.Logger.LogInformation($"Successfully generated presigned URL for key: {key}");

            return new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Headers = headers,
                Body = JsonSerializer.Serialize(new
                {
                    uploadUrl,
                    fileUrl,
                    key
                })
            };
        }
        catch (Exception ex)
        {
            context.Logger.LogError($"Error: {ex.Message}");
            context.Logger.LogError($"StackTrace: {ex.StackTrace}");
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Headers = headers,
                Body = JsonSerializer.Serialize(new { error = $"Internal server error: {ex.Message}" })
            };
        }
    }

    public class UploadRequest
    {
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
    }
}
