# 🚀 Quick Fix - Get Webhooks Working NOW

## The Problem
Your order stays "pending" because Stripe doesn't automatically send webhooks in test mode.

## The 3-Step Fix (5 minutes)

### Step 1: Install Stripe CLI
```powershell
.\stripe-webhook-test.ps1 -Install
```

### Step 2: Start Forwarding (Keep this running!)
```powershell
stripe listen --forward-to https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/payment/webhook
```

**Copy the webhook secret that appears!** It looks like: `whsec_xxxxxxxxxxxxx`

### Step 3: Update Lambda
1. Edit `d:\MicroMart\lambda\MicroMart.Payment\src\MicroMart.Payment\Function.cs`
2. Replace line 19 with your new secret:
   ```csharp
   private const string STRIPE_WEBHOOK_SECRET = "whsec_xxxxxxxxxxxxx"; // Paste your secret here
   ```
3. Deploy:
   ```powershell
   cd d:\MicroMart\lambda\MicroMart.Payment\src\MicroMart.Payment
   dotnet lambda deploy-function MicroMart-Payment --region eu-north-1
   ```

## Test It!

**Keep Stripe CLI running**, then:

1. Open your app: http://localhost:5173
2. Make a test payment (card: `4242 4242 4242 4242`)
3. Watch the Stripe CLI - you'll see the webhook event!
4. Check your orders - status should be "completed" ✅

## Why This Works

**The issue:** Stripe test mode doesn't automatically send webhooks to your endpoint.

**The fix:** Stripe CLI forwards events from your test payments to your webhook in real-time.

**For production:** Once you go live, webhooks work automatically (no CLI needed).

---

## Need Help?

- **Detailed guide:** See `STRIPE_WEBHOOK_FIX.md`
- **Test your setup:** Run `.\stripe-webhook-test.ps1 -Test`
- **Troubleshooting:** Check CloudWatch logs:
  ```powershell
  aws logs tail /aws/lambda/MicroMart-Payment --follow --region eu-north-1
  ```

## Key Points

✅ Your code is correct  
✅ Your webhook endpoint works  
✅ You just need Stripe CLI to forward events in test mode  
✅ This is how Stripe test mode is designed to work  

---

**TL;DR:** Install Stripe CLI, run `stripe listen`, update the webhook secret, deploy. Done! 🎉
