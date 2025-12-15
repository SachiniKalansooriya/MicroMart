# 🔧 Stripe Webhook Fix - Complete Guide

## 🔴 Problem Identified

You're seeing "No event deliveries found" in your Stripe Dashboard because:

**Stripe Test Mode Behavior:**
- When you complete a test payment through Stripe Checkout, the payment succeeds
- BUT Stripe does NOT automatically send webhooks to your endpoint in test mode
- The webhook endpoint exists and works, but Stripe never calls it
- This is why your orders stay as "pending" - the webhook never fires to update them

## ✅ Solution: Use Stripe CLI

The Stripe CLI forwards real-time events from your test payments to your webhook endpoint.

---

## 🚀 Step-by-Step Fix

### Step 1: Install Stripe CLI

**Option A: Using Scoop (Recommended for Windows)**
```powershell
# Run PowerShell as Administrator
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Option B: Direct Download**
1. Download from: https://github.com/stripe/stripe-cli/releases/latest
2. Download `stripe_X.X.X_windows_x86_64.zip`
3. Extract to a folder (e.g., `C:\stripe`)
4. Add to PATH: 
   - Search "Environment Variables" in Windows
   - Edit PATH, add `C:\stripe`
   - Restart PowerShell

**Verify installation:**
```powershell
stripe --version
```

---

### Step 2: Login to Stripe

```powershell
stripe login
```

This will:
- Open your browser
- Ask you to authorize the CLI
- Connect to your Stripe test account

---

### Step 3: Forward Events to Your Lambda

**Run this command and KEEP IT RUNNING:**

```powershell
stripe listen --forward-to https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

**⚠️ IMPORTANT:** Copy the new signing secret that appears!

---

### Step 4: Update Lambda with New Secret

1. **Edit your Lambda function:**
   ```powershell
   code d:\MicroMart\lambda\MicroMart.Payment\src\MicroMart.Payment\Function.cs
   ```

2. **Update line 19** with the new secret from Step 3:
   ```csharp
   private const string STRIPE_WEBHOOK_SECRET = "whsec_xxxxxxxxxxxxxxxxxxxxx"; // From Stripe CLI
   ```

3. **Deploy the updated Lambda:**
   ```powershell
   cd d:\MicroMart\lambda\MicroMart.Payment\src\MicroMart.Payment
   dotnet lambda deploy-function MicroMart-Payment --region eu-north-1
   ```

---

### Step 5: Test Complete Payment Flow

**Keep Stripe CLI running in one terminal, then:**

1. **Start your frontend** (in a new terminal):
   ```powershell
   cd d:\MicroMart\frontend
   npm run dev
   ```

2. **Open app**: http://localhost:5173

3. **Complete a test payment**:
   - Log in
   - Click "Buy Now" on any product
   - Use test card: `4242 4242 4242 4242`
   - Complete the payment

4. **Watch the magic happen** ✨
   - In the Stripe CLI terminal, you'll see:
     ```
     2025-12-15 13:03:45   --> checkout.session.completed [evt_xxx]
     2025-12-15 13:03:45  <--  [200] POST https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook [evt_xxx]
     ```
   - This proves your webhook received the event!

5. **Check your orders**:
   - Go to Orders page
   - Order should now show status: **"completed"** ✅

---

## 🎯 Quick Test Commands

I've created an automated test script for you. Run this:

```powershell
.\stripe-webhook-test.ps1
```

This will:
1. Check if Stripe CLI is installed
2. Verify your webhook endpoint is accessible
3. Send a test webhook event
4. Check if the order was updated

---

## 📊 Verification Checklist

After following the steps above, verify:

- [ ] Stripe CLI is installed: `stripe --version`
- [ ] Stripe CLI is logged in: `stripe login`
- [ ] Stripe CLI is forwarding: `stripe listen --forward-to https://...`
- [ ] Lambda has the new webhook secret from Stripe CLI
- [ ] Lambda is deployed with new secret
- [ ] Frontend is running
- [ ] Test payment completed successfully
- [ ] Stripe CLI shows the event was forwarded
- [ ] Order status changed from "pending" to "completed"

---

## 🐛 Troubleshooting

### Issue: "stripe: command not found"
**Solution:** Stripe CLI not in PATH. Restart PowerShell or add to PATH manually.

### Issue: Stripe CLI shows "Unauthorized"
**Solution:** Run `stripe login` again.

### Issue: Events forwarded but order still pending
**Possible causes:**
1. Lambda doesn't have the new webhook secret → Update and redeploy
2. Lambda crashed → Check CloudWatch logs:
   ```powershell
   aws logs tail /aws/lambda/MicroMart-Payment --follow --region eu-north-1
   ```

### Issue: Can't keep Stripe CLI running all the time
**For production:** Configure the actual webhook in Stripe Dashboard with your live endpoint. But for test mode, you MUST use Stripe CLI.

---

## 🎓 Why This Is Necessary

**Test Mode vs Production Mode:**

| Mode | Webhook Behavior |
|------|-----------------|
| **Test Mode** | ❌ Webhooks NOT automatically sent. Must use Stripe CLI. |
| **Production Mode** | ✅ Webhooks automatically sent to your endpoint. |

This is Stripe's design to:
- Prevent spam to development endpoints
- Give developers control over when webhooks fire
- Make testing easier and more predictable

---

## 🔄 Alternative: Use "Send test events" (Quick Check Only)

If you just want to verify your webhook handler works (not test the full flow):

1. Go to Stripe Dashboard → Webhooks → sophisticated-triumph
2. Click "Send test events"
3. Select `checkout.session.completed`
4. Click "Send test event"

**⚠️ Limitation:** This sends a sample event, not your actual payment data. Good for testing the webhook handler logic, but won't update your actual order.

---

## 📝 Summary

**The root cause:** Stripe test mode doesn't send webhooks automatically.

**The fix:** Use Stripe CLI to forward events while developing.

**For production:** Once you go live, webhooks will work automatically without Stripe CLI.

**Your next steps:**
1. Install Stripe CLI
2. Run `stripe listen --forward-to https://...`
3. Update Lambda with the new secret
4. Test a payment
5. Celebrate! 🎉
