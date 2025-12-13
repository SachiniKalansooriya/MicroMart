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
            var body = JsonSerializer.Deserialize<UploadRequest>(request.Body);
            
            if (body == null || string.IsNullOrEmpty(body.FileName) || string.IsNullOrEmpty(body.FileType))
            {
                return new APIGatewayProxyResponse
                {
                    StatusCode = 400,
                    Headers = headers,
                    Body = JsonSerializer.Serialize(new { error = "fileName and fileType are required" })
                };
            }

            // Generate unique file key
            var fileExtension = Path.GetExtension(body.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var key = $"products/{uniqueFileName}";

            // Generate presigned URL
            var request2 = new GetPreSignedUrlRequest
            {
                BucketName = BucketName,
                Key = key,
                Verb = HttpVerb.PUT,
                Expires = DateTime.UtcNow.AddMinutes(15),
                ContentType = body.FileType
            };

            var uploadUrl = _s3Client.GetPreSignedURL(request2);
            var fileUrl = $"https://{BucketName}.s3.eu-north-1.amazonaws.com/{key}";

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
            return new APIGatewayProxyResponse
            {
                StatusCode = 500,
                Headers = headers,
                Body = JsonSerializer.Serialize(new { error = "Internal server error" })
            };
        }
    }

    public class UploadRequest
    {
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
    }
}