# MicroMart - E-Commerce Platform

A modern, full-stack e-commerce platform built with React, TypeScript, AWS Lambda, and DynamoDB. Deployed with HTTPS on Vercel with AWS backend services.

🔗 **Live Demo**: [https://micromart-theta.vercel.app](https://micromart-theta.vercel.app)

## Features

- **Customer Features**
  - Browse products with search and filter
  - Multi-color product selection 
  - Shopping cart with multi-item checkout
  - Order tracking and history
  - Secure Stripe payment integration
  - User authentication (JWT)

- **Admin Features**
  - Product management (CRUD)
  - Multi-color product variants 
  - Order management with status updates
  - Customer management
  - Dashboard with analytics
  - Direct S3 image upload with presigned URLs

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (Fast build tool)
- Tailwind CSS (Utility-first styling)
- React Router v6 (Client-side routing)
- Context API (State management)
- Deployed on **Vercel** with HTTPS

### Backend
- AWS Lambda (.NET 8 Runtime)
- API Gateway (HTTP API with JWT authorization)
- DynamoDB (NoSQL database)
- S3 (Image storage with presigned URLs)
- Stripe (Payment processing)
- CloudWatch (Logging and monitoring)

## Prerequisites

- Node.js 18+ and npm
- .NET 8 SDK
- AWS CLI configured
- AWS Account
- Stripe Account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SachiniKalansooriya/MicroMart.git
cd MicroMart
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=https://your-api-gateway-id.execute-api.your-region.amazonaws.com/prod
```

Replace with your actual API Gateway URL from AWS Console.

### 3. Deploy to Vercel (Production)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production with HTTPS
vercel --prod
```

The app will be deployed with:
- ✅ Automatic HTTPS/SSL
- ✅ Global CDN
- ✅ Client-side routing support
- ✅ Auto-deployments from Git

**Important**: Create `vercel.json` in the frontend directory:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures React Router works correctly on page refresh.

### 4. AWS Infrastructure Setup

#### DynamoDB Tables

Create the following DynamoDB tables:

1. **MicroMart-Users**
   - Partition Key: `userId` (String)

2. **MicroMart-Products**
   - Partition Key: `productId` (String)

3. **MicroMart-Orders**
   - Partition Key: `orderId` (String)
   - GSI: `userId-index` with partition key `userId`

#### Lambda Functions

Deploy the following Lambda functions:

1. **MicroMart-Auth-Login** (.NET 8)
2. **MicroMart-Auth-Signup** (.NET 8)
3. **MicroMart-Authorizer** (.NET 8)
4. **MicroMart-Payment** (.NET 8)
   - **Environment Variables Required**:
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
5. **MicroMart-Products** (.NET 8)
6. **MicroMart-Upload** (.NET 8)
7. **MicroMart-Users** (.NET 8)

> **Important**: Configure Stripe environment variables in AWS Lambda Console:
> 1. Go to Lambda → MicroMart-Payment → Configuration → Environment variables
> 2. Add `STRIPE_SECRET_KEY` with your key from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
> 3. Add `STRIPE_WEBHOOK_SECRET` with your webhook secret

#### API Gateway

1. Create an HTTP API in API Gateway
2. Configure routes for each Lambda function
3. Set up JWT authorizer using the MicroMart-Authorizer Lambda
4. Enable CORS
5. Deploy to `prod` stage

#### S3 Buckets

Create two S3 buckets:

1. **micromart-product-images** - For product images
   - Enable public read access
   - Configure CORS to allow uploads from your domain:

```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:5173",
        "https://micromart-theta.vercel.app",
        "https://*.vercel.app"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS configuration:
```bash
aws s3api put-bucket-cors --bucket micromart-product-images --cors-configuration file://cors-config.json --region eu-north-1
```

2. **micromart-frontend-app** - Optional S3 static hosting backup

#### IAM Roles

Create IAM roles with appropriate permissions for:
- Lambda execution
- DynamoDB access
- S3 access
- CloudWatch Logs

### 4. Environment Variables for Lambda Functions

Each Lambda function needs the following environment variables:

**Auth Functions:**
- `JWT_SECRET`: Your JWT secret key
- `USERS_TABLE`: MicroMart-Users

**Payment Service:**
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `ORDERS_TABLE`: MicroMart-Orders
- `PRODUCTS_TABLE`: MicroMart-Products

**Product Service:**
- `PRODUCTS_TABLE`: MicroMart-Products

**Upload Service:**
- `S3_BUCKET_NAME`: micromart-product-images

**Users Service:**
- `USERS_TABLE`: MicroMart-Users

## Product Color Management

### Admin Side
Admins can add multiple colors for each product:
- Single color: Enter "Red" and click "Add Color"
- Multiple colors: Enter "Red, Blue, Black" to add all at once
- Each color appears as a removable tag

### Customer Side
Customers must select exactly one color before purchasing:
- Dropdown shows all available colors
- Color selection is required (indicated by red asterisk)
- Validation prevents checkout without color selection
- Cart tracks selected color per item

## Deployment

### Vercel (Frontend - Current)
```bash
cd frontend
npm run build
vercel --prod
```

### AWS S3 (Alternative Frontend Hosting)
```bash
npm run build
aws s3 sync dist/ s3://micromart-frontend-app --delete --region eu-north-1
```

Note: S3 only supports HTTP. Use CloudFront for HTTPS or stick with Vercel.

### 5. Stripe Configuration

1. Create a Stripe account at [https://stripe.com](https://stripe.com)
2. Get your API keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
3. Configure webhook endpoint in Stripe Dashboard:
   - URL: `https://your-api-gateway-url/payment/webhook`
   - Events: `checkout.session.completed`
4. Add webhook secret to Lambda environment variables

See `STRIPE_WEBHOOK_SETUP.md` for detailed webhook configuration.

### 6. Running the Application

#### Development

```bash
cd frontend
npm run dev
```

The application will run on `http://localhost:5173`

#### Production

**Option 1: Vercel (Recommended - HTTPS enabled)**
```bash
vercel --prod
```

**Option 2: Local Preview**
```bash
npm run build
npm run preview
```

## Live URLs

- **Production (Vercel)**: [https://micromart-theta.vercel.app](https://micromart-theta.vercel.app)
- **S3 Backup**: http://micromart-frontend-app.s3-website.eu-north-1.amazonaws.com (HTTP only)

## Default Admin Credentials

For testing purposes, you can create an admin user via the signup page or directly in DynamoDB.

**Test Admin Account:**
- Email: admin@gmail.com
- Password: admin123
- Role: admin

To create manually in DynamoDB `MicroMart-Users` table:

```json
{
  "userId": "admin-001",
  "name": "Admin User",
  "email": "admin@gmail.com",
  "passwordHash": "[hashed-password]",
  "role": "admin",
  "createdAt": "2025-12-17T00:00:00Z"
}
```

Note: Password should be hashed using bcrypt before storing.

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Products
- `GET /products` - Get all products
- `GET /products/{id}` - Get product by ID
- `POST /products` - Create product (Admin)
- `PUT /products/{id}` - Update product (Admin)
- `DELETE /products/{id}` - Delete product (Admin)

### Orders
- `GET /orders` - Get user orders
- `GET /admin/orders` - Get all orders (Admin)
- `PUT /orders/{id}/status` - Update order status (Admin)

### Users
- `GET /admin/users` - Get all users (Admin)
- `GET /users/{id}` - Get user by ID

### Payment
- `POST /payment/create-checkout` - Create Stripe checkout session

### Upload
- `POST /upload/presigned-url` - Get S3 presigned URL for direct upload

## Key Features Explained

### Multi-Color Product System
- **Admin workflow**: Add product → Enter colors (comma-separated) → Save
- **Customer workflow**: Browse → Select product → Choose ONE color → Add to cart
- **Cart behavior**: Same product with different colors = separate cart items
- **Data flow**: Colors stored as comma-separated string in DB, parsed to array in frontend

### Secure Image Upload
- Frontend requests presigned URL from Lambda
- Lambda generates temporary S3 upload URL
- Frontend uploads directly to S3 (no Lambda bottleneck)
- URL expires after 15 minutes for security

### JWT Authentication
- Login returns JWT token
- Token stored in localStorage
- API Gateway validates token via Authorizer Lambda
- Role-based access control (admin/customer)

## Troubleshooting

### CORS Errors on Image Upload
Update S3 bucket CORS to include your Vercel domain:
```bash
aws s3api put-bucket-cors --bucket micromart-product-images --cors-configuration file://cors-config.json
```

### 404 on Page Refresh (Vercel)
Ensure `vercel.json` exists with rewrite rule:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Payment Webhook Not Working
1. Check webhook URL in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` in Lambda environment variables
3. Check CloudWatch logs for errors

### Images Not Loading
1. Verify S3 bucket has public read access
2. Check CORS configuration includes your domain
3. Verify presigned URL generation in Lambda logs

## Project Structure

```
MicroMart/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components (ProductForm, Navbar, etc.)
│   │   ├── contexts/        # React contexts (Auth, Cart)
│   │   ├── pages/           # Page components (Login, Register, Dashboard, etc.)
│   │   ├── services/        # API services (auth, product, payment, s3)
│   │   ├── config/          # Environment configuration
│   │   └── App.tsx          # Main app component with routing
│   ├── public/              # Static assets (images, backgrounds)
│   ├── .env                 # Environment variables (gitignored)
│   ├── .env.example         # Example environment variables
│   ├── vercel.json          # Vercel deployment configuration
│   ├── cors-config.json     # S3 CORS configuration
│   └── package.json
├── lambda/                   # AWS Lambda functions (.NET 8)
│   ├── MicroMart.Auth.Login/      # User login
│   ├── MicroMart.Auth.Signup/     # User registration
│   ├── MicroMart.Authorizer/      # JWT validation for API Gateway
│   ├── MicroMart.Payment/         # Stripe checkout & webhooks
│   ├── MicroMart.Products/        # Product CRUD operations
│   ├── MicroMart.Upload/          # S3 presigned URL generation
│   └── MicroMart.Users/           # User management
├── STRIPE_WEBHOOK_SETUP.md   # Stripe webhook configuration guide
├── WEBHOOK_TESTING_GUIDE.md  # Webhook testing instructions
└── README.md
```

## AWS Resources

### Region
- **Primary Region**: eu-north-1 (Stockholm)

### Services Used
- **Lambda Functions**: 7 functions (.NET 8 runtime)
- **API Gateway**: HTTP API with JWT authorizer
- **DynamoDB**: 3 tables (Users, Products, Orders)
- **S3**: 2 buckets (product images, frontend hosting)
- **CloudWatch**: Logs and monitoring

### IAM Permissions Required
- `lambda:InvokeFunction`
- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan`
- `s3:PutObject`, `s3:GetObject`, `s3:PutBucketCors`
- `logs:CreateLogGroup`, `CreateLogStream`, `PutLogEvents`

## Technology Highlights

- ⚡ **Vite**: Lightning-fast development and optimized production builds
- 🎨 **Tailwind CSS**: Utility-first styling with custom color scheme
- 🔐 **JWT Authentication**: Secure token-based auth with AWS Lambda authorizer
- 💳 **Stripe Integration**: Production-ready payment processing
- 📦 **Serverless Architecture**: Auto-scaling, pay-per-use AWS Lambda
- 🚀 **Vercel Deployment**: Edge network with automatic HTTPS
- 📸 **Direct S3 Upload**: Presigned URLs for efficient image handling
- 🎯 **TypeScript**: Type-safe code across frontend and backend

## License

This project is licensed under the MIT License.

## Author

- **Sachini Kalansooriya** - [GitHub](https://github.com/SachiniKalansooriya)

## Acknowledgments

- AWS Lambda for serverless backend
- Stripe for payment processing
- Vercel for hassle-free frontend hosting
- React and TypeScript communities

---

**Built with ❤️ using React, TypeScript, .NET, AWS, vercel and Stripe**
