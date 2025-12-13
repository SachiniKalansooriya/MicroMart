# AWS S3 Setup for Product Image Uploads

## Overview
This guide will help you set up AWS S3 for product image uploads in your MicroMart application.

## Step 1: Create S3 Bucket

1. **Open AWS S3 Console**
   - Go to https://console.aws.amazon.com/s3/
   - Click "Create bucket"

2. **Configure Bucket**
   - **Bucket name**: `micromart-product-images` (must be globally unique, adjust if needed)
   - **Region**: `eu-north-1` (same as your Lambda functions)
   - **Block Public Access settings**: 
     - ✅ Uncheck "Block all public access" (we need public read access for product images)
     - ✅ Acknowledge the warning
   - Click "Create bucket"

3. **Configure Bucket Policy**
   - Select your bucket
   - Go to "Permissions" tab
   - Scroll to "Bucket policy"
   - Click "Edit" and paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

4. **Configure CORS**
   - Still in "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"
   - Click "Edit" and paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Step 2: Create Lambda Function for Presigned URLs

You need to create a Lambda function that generates presigned URLs for secure uploads.

### Create the Lambda Project

```powershell
# Navigate to lambda directory
cd D:\MicroMart\lambda

# Create new Lambda project
dotnet new lambda.EmptyFunction -n MicroMart.Upload -o MicroMart.Upload

cd MicroMart.Upload\src\MicroMart.Upload
```

### Install Required NuGet Packages

```powershell
dotnet add package AWSSDK.S3
dotnet add package Amazon.Lambda.APIGatewayEvents
```

### Lambda Function Code

Create `Function.cs`:

```csharp
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
```

### Deploy the Lambda Function

```powershell
# Build and deploy
dotnet lambda deploy-function MicroMart-Upload --region eu-north-1
```

**During deployment, configure:**
- **Runtime**: .NET 8
- **Handler**: MicroMart.Upload::MicroMart.Upload.Function::FunctionHandler
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Environment Variables**:
  - `BUCKET_NAME`: `micromart-product-images`

## Step 3: Update IAM Role Permissions

Your Lambda function needs S3 permissions:

1. Go to **IAM Console** → **Roles**
2. Find the role used by `MicroMart-Upload` Lambda
3. Add this inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::micromart-product-images/*"
    }
  ]
}
```

## Step 4: Add Route to API Gateway

1. Go to **API Gateway Console**
2. Select your API: `kpk440vdkf`
3. Click "Routes"
4. Click "Create"
   - **Method**: POST
   - **Path**: `/upload/presigned-url`
   - **Integration**: MicroMart-Upload Lambda
   - **Authorizer**: Your Lambda Authorizer (same as products endpoint)

## Step 5: Test the Integration

### Test Upload from Frontend

1. Start your frontend: `npm run dev`
2. Login as admin
3. Go to Products page
4. Click "Add Product"
5. Click the image upload area
6. Select an image file (PNG, JPG, GIF)
7. You should see a preview
8. Fill in other product details
9. Click "Add Product"
10. The image should upload to S3 and the product should be created with the S3 URL

### Manual Test with PowerShell

```powershell
# Get auth token
$loginResponse = Invoke-RestMethod -Uri 'https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/auth/login' -Method POST -Body (@{email='admin@gmail.com'; password='admin123'} | ConvertTo-Json) -ContentType 'application/json'
$token = $loginResponse.token

# Get presigned URL
$uploadResponse = Invoke-RestMethod -Uri 'https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/upload/presigned-url' -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{fileName='test.jpg'; fileType='image/jpeg'} | ConvertTo-Json) -ContentType 'application/json'

Write-Host "Upload URL: $($uploadResponse.uploadUrl)"
Write-Host "File URL: $($uploadResponse.fileUrl)"

# Upload a test file
Invoke-RestMethod -Uri $uploadResponse.uploadUrl -Method PUT -InFile "path\to\your\test-image.jpg" -ContentType 'image/jpeg'
```

## Troubleshooting

### CORS Issues
- Make sure CORS is configured on both S3 bucket and API Gateway
- Check that `Access-Control-Allow-Origin` header is set in Lambda responses

### 403 Forbidden
- Check S3 bucket policy allows public read access
- Verify Lambda IAM role has S3 permissions

### Upload Fails
- Check presigned URL expiration (15 minutes default)
- Verify file MIME type matches the presigned URL content type
- Check CloudWatch logs for Lambda errors

### Image Not Displaying
- Verify bucket policy allows public read
- Check the file was actually uploaded to S3 (check S3 console)
- Make sure the URL format is correct: `https://bucket-name.s3.region.amazonaws.com/key`

## Cost Considerations

- **S3 Storage**: ~$0.023 per GB/month (eu-north-1)
- **S3 Requests**: ~$0.005 per 1,000 PUT requests
- **Data Transfer**: First 100 GB/month free from S3 to internet
- **Lambda**: Included in free tier (1M requests/month)

For a small e-commerce site, expect < $1/month for image storage.

## Security Best Practices

1. ✅ Use presigned URLs with short expiration (15 minutes)
2. ✅ Require authentication to get presigned URLs
3. ✅ Validate file types on backend
4. ✅ Limit file size (5MB in frontend)
5. ⚠️ Consider adding virus scanning for production
6. ⚠️ Consider using CloudFront for better performance
7. ⚠️ Add image optimization (resize/compress) Lambda trigger

## Next Steps

1. **Image Optimization**: Add Lambda function triggered by S3 upload to resize/compress images
2. **CDN**: Set up CloudFront distribution for faster image delivery
3. **Backup**: Enable S3 versioning and lifecycle policies
4. **Monitoring**: Set up CloudWatch alarms for S3 and Lambda errors
