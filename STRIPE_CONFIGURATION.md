# Stripe Configuration Guide

## Overview

MicroMart uses Stripe for payment processing. The Stripe API keys are stored as environment variables for security.

## Environment Variables

### Frontend (.env)

```env
VITE_STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### AWS Lambda (MicroMart-Payment)

The Payment Lambda function reads Stripe keys from AWS Lambda environment variables:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Setup Instructions

### 1. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret Key** (starts with `sk_test_`)
3. Create a webhook endpoint to get the **Webhook Secret**:
   - Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Add endpoint: `https://your-api-gateway.amazonaws.com/prod/payment/webhook`
   - Select event: `checkout.session.completed`
   - Copy the webhook signing secret (starts with `whsec_`)

### 2. Configure Frontend

Add to `frontend/.env`:

```env
VITE_STRIPE_SECRET_KEY=sk_test_51...
VITE_STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Configure AWS Lambda

Set environment variables in AWS Lambda Console:

```bash
# Using AWS CLI
aws lambda update-function-configuration \
  --function-name MicroMart-Payment \
  --environment Variables="{STRIPE_SECRET_KEY=sk_test_51...,STRIPE_WEBHOOK_SECRET=whsec_...}" \
  --region eu-north-1
```

Or via AWS Console:
1. Go to Lambda → MicroMart-Payment
2. Configuration → Environment variables
3. Add both keys

## Code Implementation

### Lambda Function (Function.cs)

```csharp
private readonly string STRIPE_SECRET_KEY;
private readonly string STRIPE_WEBHOOK_SECRET;

public Function()
{
    // Reads from environment variables with fallback
    STRIPE_SECRET_KEY = Environment.GetEnvironmentVariable("STRIPE_SECRET_KEY") 
        ?? "fallback_key";
    STRIPE_WEBHOOK_SECRET = Environment.GetEnvironmentVariable("STRIPE_WEBHOOK_SECRET") 
        ?? "fallback_secret";
    
    StripeConfiguration.ApiKey = STRIPE_SECRET_KEY;
}
```

## Security Best Practices

### ✅ DO:
- Store Stripe keys in environment variables
- Use test keys (`sk_test_`) for development
- Use production keys (`sk_live_`) only in production
- Configure webhook signature verification
- Keep `.env` in `.gitignore`

### ❌ DON'T:
- Commit Stripe keys to version control
- Share Stripe keys in public channels
- Use production keys in development
- Disable webhook signature verification
- Expose keys in client-side code

## Webhook Events

The MicroMart-Payment Lambda handles the following Stripe webhook events:

- **checkout.session.completed**: Creates orders in DynamoDB after successful payment

## Testing Stripe Integration

### 1. Test Card Numbers

Use these test cards for testing:

| Card Number | Description |
|------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Payment declined |
| 4000 0025 0000 3155 | Requires authentication |

### 2. Test Webhooks Locally

Use Stripe CLI:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Listen for webhook events
stripe listen --forward-to https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

### 3. Test Payment Flow

1. Add products to cart
2. Click "Proceed to Checkout"
3. Use test card: 4242 4242 4242 4242
4. Complete payment
5. Verify order appears in admin dashboard
6. Check CloudWatch logs for webhook processing

## Troubleshooting

### Webhook Not Working

1. **Check webhook URL**:
   ```bash
   # Verify endpoint is reachable
   curl -X POST https://your-api-gateway.amazonaws.com/prod/payment/webhook
   ```

2. **Check CloudWatch logs**:
   ```bash
   aws logs tail /aws/lambda/MicroMart-Payment --follow --region eu-north-1
   ```

3. **Verify webhook secret**:
   - Must match between Stripe Dashboard and Lambda environment variable
   - Check for typos or extra spaces

### Payment Not Creating Orders

1. **Check metadata**: Payment session must include `userId` and `itemsData`
2. **Verify DynamoDB permissions**: Lambda role needs `PutItem` permission
3. **Check stock levels**: Products with 0 stock may cause issues

## Reference

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)

## Support

For Stripe-related issues:
1. Check [Stripe Dashboard](https://dashboard.stripe.com/test/logs) logs
2. Review Lambda CloudWatch logs
3. Test with Stripe CLI
4. Contact Stripe Support for API issues
