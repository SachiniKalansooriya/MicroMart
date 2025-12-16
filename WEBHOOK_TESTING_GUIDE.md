# Testing Stripe Webhooks - Complete Guide

## Problem
Stripe does NOT automatically send webhooks to your endpoint when you complete test payments through the Stripe Checkout UI. This is why you see "No event deliveries found" in the Stripe Dashboard.

## Solution Options

### Option 1: Send Test Events (Quick Test)

1. Go to your Stripe Dashboard → Webhooks → sophisticated-triumph
2. Click **"Send test events"** button (top right)
3. Select event type: `checkout.session.completed`
4. Stripe will generate a sample event and send it to your webhook
5. Check CloudWatch logs to see if webhook processed successfully

**Note:** This sends a fake/sample event, not your actual payment data.

---

### Option 2: Stripe CLI (Best for Real Testing)

This forwards real Stripe events from your test payments to your local/deployed webhook.

#### Step 1: Install Stripe CLI

**Windows (PowerShell as Administrator):**
```powershell
# Using Scoop
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# OR download directly from:
# https://github.com/stripe/stripe-cli/releases/latest
```

**Verify installation:**
```powershell
stripe --version
```

#### Step 2: Login to Stripe

```powershell
stripe login
```

This will open a browser for authentication.

#### Step 3: Forward Events to Your Lambda

```powershell
stripe listen --forward-to https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Important:** Copy this new signing secret!

#### Step 4: Update Lambda with CLI Webhook Secret

1. Edit `Function.cs` line 25:
```csharp
private const string STRIPE_WEBHOOK_SECRET = "whsec_xxxxxxxxxxxxx"; // Use the secret from CLI
```

2. Deploy Lambda:
```powershell
cd D:\MicroMart\lambda\MicroMart.Payment\src\MicroMart.Payment
dotnet lambda deploy-function MicroMart-Payment --region eu-north-1
```

#### Step 5: Test Payment

1. Keep Stripe CLI running (listening)
2. Go to http://localhost:5173
3. Complete a test payment
4. Watch the Stripe CLI output - you'll see events in real-time
5. Check your orders page - order should show as completed

---

### Option 3: Switch to Live Mode (Production Only)

In live mode, Stripe automatically sends webhooks for all events. But you need:
- Completed business verification
- Real payment processing enabled
- Real credit cards (no test cards)

---

## Why This Happens

**Test Mode Behavior:**
- Stripe Checkout sessions in test mode are "simulated"
- Webhooks are NOT automatically sent to your endpoint
- You must use Stripe CLI or "Send test events" to trigger webhooks

**Live Mode Behavior:**
- Real payments trigger real events
- Webhooks are automatically sent to your endpoint
- No Stripe CLI needed

---

## Recommended Workflow

**For Development (Current):**
1. Use Stripe CLI to forward events while testing
2. Keep CLI running in a terminal while developing
3. Real-time event forwarding for every test payment

**For Production:**
1. Switch to live mode
2. Update webhook secret to the one from Stripe Dashboard (not CLI)
3. Webhooks will be sent automatically

---

## Current Status

✅ Webhook endpoint configured: https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook
✅ Lambda function with null safety fixes deployed
✅ Stripe Checkout creating sessions successfully
❌ Webhooks not being sent (because test mode without CLI)

**Next Step:** Use Stripe CLI to forward events OR click "Send test events" to verify webhook works.
