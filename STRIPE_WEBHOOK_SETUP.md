# Stripe Webhook Setup Guide

## ✅ Clean Implementation Status

Your payment service is now properly implemented with:
- ✅ Stripe Checkout integration
- ✅ Webhook handler with signature verification
- ✅ Pending → Completed order flow
- ✅ No workaround code

---

## 🔧 Stripe Dashboard Configuration

### Step 1: Configure Webhook Endpoint

1. Go to your Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"** (or edit existing endpoint)
3. **Endpoint URL**: `https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook`
4. **Events to send**: Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.async_payment_succeeded` (optional, for async payments)
5. **Mode**: Ensure you're in **Test mode** (toggle in top-right corner)
6. Click **"Add endpoint"**

### Step 2: Verify Webhook Secret

After creating the webhook, you'll see a **"Signing secret"** that looks like:
```
whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Current webhook secret in your Lambda**: `whsec_wSa98ZWJIDiiJWSmf3GJb2qFK0s6Oaek`

⚠️ **IMPORTANT**: If the signing secret in Stripe Dashboard doesn't match the one in your Lambda, you need to update it!

---

## 🧪 Testing the Payment Flow

### Test Payment Steps:

1. **Start your frontend**:
   ```bash
   cd D:\MicroMart\frontend
   npm run dev
   ```

2. **Open your app**: http://localhost:5173

3. **Complete a test payment**:
   - Log in to your account
   - Click "Buy Now" on any product
   - On Stripe checkout page, use test card:
     - **Card Number**: `4242 4242 4242 4242`
     - **Expiry**: Any future date (e.g., `12/34`)
     - **CVC**: Any 3 digits (e.g., `123`)
     - **Name**: Any name
   - **Click "Pay" button** (don't just close the tab!)
   - Wait for redirect to success page

4. **Verify webhook fired**:
   - Go to Stripe Dashboard → **Developers → Events**
   - You should see a `checkout.session.completed` event
   - Go to **Webhooks** → Click your endpoint → **Event deliveries** tab
   - You should see the webhook delivery with status **200 OK**

5. **Check your orders**:
   - Click "View Orders Now" on success page
   - Order should show status: **"completed"** (updated by webhook)

---

## 🔍 Troubleshooting

### Problem: No webhook deliveries in Stripe Dashboard

**Possible causes:**
1. ✗ Payment didn't actually complete (didn't click "Pay" button)
2. ✗ Webhook is **Disabled** in Stripe Dashboard
3. ✗ Wrong mode (webhook in Live mode, but using Test keys)
4. ✗ Endpoint URL is incorrect

**Solutions:**
- Ensure you click "Pay" button and wait for redirect
- Check webhook Status is **Enabled** (not Disabled)
- Verify you're in **Test mode** (toggle in top-left)
- Double-check endpoint URL is correct

### Problem: Webhook failing with 400/500 error

**Possible causes:**
1. ✗ Webhook signature mismatch (wrong secret in Lambda)
2. ✗ Lambda timeout or crash

**Solutions:**
- Check CloudWatch logs for error details:
  ```bash
  aws logs tail /aws/lambda/MicroMart-Payment --follow --region eu-north-1
  ```
- Verify webhook secret matches Stripe Dashboard
- Check Lambda has proper IAM permissions for DynamoDB

### Problem: Orders stuck in "pending" status

**Possible causes:**
1. ✗ Webhook not configured in Stripe
2. ✗ Webhook URL incorrect
3. ✗ Stripe not sending events (payment didn't complete)

**Solutions:**
- Complete test payment and immediately check Stripe Events tab
- If event exists but webhook didn't fire, check endpoint URL
- Test webhook manually: Stripe Dashboard → Webhooks → "Send test webhook"

---

## 📊 Monitoring

### Check CloudWatch Logs

```bash
# Real-time monitoring
aws logs tail /aws/lambda/MicroMart-Payment --follow --region eu-north-1

# Check for webhook activity
aws logs tail /aws/lambda/MicroMart-Payment --since 1h --region eu-north-1 | Select-String "webhook"

# Check for errors
aws logs tail /aws/lambda/MicroMart-Payment --since 1h --region eu-north-1 | Select-String "Error|Exception"
```

### Check Orders in DynamoDB

```bash
# View all orders
aws dynamodb scan --table-name MicroMart-Orders --region eu-north-1

# Check pending orders
aws dynamodb scan --table-name MicroMart-Orders --region eu-north-1 | ConvertFrom-Json | Select-Object -ExpandProperty Items | Where-Object { $_.paymentStatus.S -eq "pending" }
```

---

## 🎯 Expected Flow

```
1. User clicks "Buy Now"
   ↓
2. Frontend calls: POST /payment/create-checkout
   ↓
3. Lambda creates Stripe session + creates PENDING order in DynamoDB
   ↓
4. User redirected to Stripe checkout page
   ↓
5. User enters card details and clicks "Pay"
   ↓
6. Stripe processes payment
   ↓
7. Stripe sends webhook: POST /payment/webhook
   ↓
8. Lambda verifies signature → Updates order to COMPLETED
   ↓
9. User redirected to success page
   ↓
10. User views orders → Order shows status "completed"
```

---

## 🔐 Security Notes

- ✅ Webhook signature verification enabled (using `STRIPE_WEBHOOK_SECRET`)
- ✅ JWT authentication for checkout and orders endpoints
- ✅ CORS configured for localhost:5173
- ✅ Stripe secret keys stored in Lambda code (consider moving to AWS Secrets Manager for production)

---

## 📝 Configuration Summary

| Setting | Value |
|---------|-------|
| **Webhook Endpoint** | `https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook` |
| **Webhook Events** | `checkout.session.completed` |
| **Webhook Secret** | `whsec_wSa98ZWJIDiiJWSmf3GJb2qFK0s6Oaek` |
| **Stripe API Key** | `sk_test_51SdwrbQXeqGKU49H...` (test mode) |
| **API Gateway** | `kpk440vdkf` (eu-north-1) |
| **Lambda Function** | `MicroMart-Payment` |
| **DynamoDB Table** | `MicroMart-Orders` |
| **Frontend URL** | `http://localhost:5173` |

---

## ✅ Next Steps

1. **Configure webhook in Stripe Dashboard** (Step 1 above)
2. **Verify webhook secret matches** (Step 2 above)
3. **Test payment flow** (complete test purchase)
4. **Monitor CloudWatch logs** during test
5. **Verify order status changes** from pending → completed

---

## 🆘 Still Having Issues?

If webhooks still aren't working after following this guide:

1. **Test webhook manually** in Stripe Dashboard:
   - Go to Webhooks → Your endpoint → "Send test webhook"
   - Select `checkout.session.completed` event
   - Check if it succeeds

2. **Use Stripe CLI** for local testing:
   ```bash
   stripe listen --forward-to https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook
   ```

3. **Check Lambda permissions**:
   - Ensure Lambda has `dynamodb:PutItem`, `dynamodb:Scan` permissions
   - Check Lambda execution role: `MicroMart-Lambda-Role`

4. **Verify API Gateway route**:
   ```bash
   aws apigatewayv2 get-routes --api-id kpk440vdkf --region eu-north-1 --query 'Items[?RouteKey==`POST /payment/webhook`]'
   ```
