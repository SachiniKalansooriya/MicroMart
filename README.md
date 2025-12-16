# MicroMart - E-Commerce Platform

A full-stack e-commerce platform built with React, TypeScript, AWS Lambda, and DynamoDB.

## Features

- **Customer Features**
  - Browse products with search and filter
  - Shopping cart with multi-item checkout
  - Order tracking and history
  - Stripe payment integration
  - User authentication (JWT)

- **Admin Features**
  - Product management (CRUD)
  - Order management with status updates
  - Customer management
  - Dashboard with analytics
  - Image upload to S3

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS
- React Router
- Context API for state management

### Backend
- AWS Lambda (.NET 8 & Node.js)
- API Gateway (HTTP API)
- DynamoDB
- S3 for image storage
- Stripe for payments

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
VITE_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

Replace with your actual values:
- Get API Gateway URL from AWS Console
- Get Stripe keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)

### 3. AWS Infrastructure Setup

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

1. **MicroMart-Auth-Login** (Node.js)
2. **MicroMart-Auth-Signup** (Node.js)
3. **MicroMart-Authorizer** (Node.js)
4. **MicroMart-Payment** (.NET 8)
   - **Environment Variables Required**:
     - `STRIPE_SECRET_KEY`: Your Stripe secret key
     - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
5. **MicroMart-Products** (Node.js)
6. **MicroMart-Upload** (Node.js)
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

#### S3 Bucket

Create an S3 bucket for product images with public read access.

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
- `S3_BUCKET_NAME`: Your S3 bucket name

**Users Service:**
- `USERS_TABLE`: MicroMart-Users

### 5. Stripe Configuration

1. Create a Stripe account
2. Get your API keys from the Stripe Dashboard
3. Configure webhook endpoint for payment events
4. Add webhook secret to Lambda environment variables

### 6. Running the Application

#### Development

```bash
cd frontend
npm run dev
```

The application will run on `http://localhost:5173`

#### Production Build

```bash
npm run build
npm run preview
```

## Default Admin Credentials

After deploying, create an admin user in DynamoDB:

```json
{
  "userId": "admin-user-id",
  "name": "Admin User",
  "email": "admin@micromart.com",
  "password": "hashed-password",
  "role": "admin"
}
```

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
- `POST /upload/presigned-url` - Get S3 presigned URL

## Project Structure

```
MicroMart/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
├── lambda/                   # AWS Lambda functions
│   ├── MicroMart.Auth.Login/
│   ├── MicroMart.Auth.Signup/
│   ├── MicroMart.Authorizer/
│   ├── MicroMart.Payment/
│   ├── MicroMart.Products/
│   ├── MicroMart.Upload/
│   └── MicroMart.Users/
└── README.md
```

## Security Considerations

- **Never commit** `.env` files or sensitive credentials
- Use environment variables for all secrets
- Enable HTTPS only in production
- Implement rate limiting on API Gateway
- Use AWS Secrets Manager for production secrets
- Enable CloudWatch logging for monitoring
- Implement proper IAM least privilege policies

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For issues and questions, please open an issue on GitHub.

## Authors

- Sachini Kalansooriya
