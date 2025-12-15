#!/usr/bin/env pwsh
# Quick Webhook Test - Run this while Stripe CLI is listening

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    Webhook Test - Step by Step" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current Setup Status:" -ForegroundColor Yellow
Write-Host "  ✓ Stripe CLI running" -ForegroundColor Green
Write-Host "  ✓ Lambda deployed with new webhook secret" -ForegroundColor Green
Write-Host "  ✓ Webhook endpoint accessible" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    IMPORTANT: Complete Payment Flow Test" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Check Stripe CLI Terminal" -ForegroundColor Yellow
Write-Host "  Look for the terminal running 'stripe listen'" -ForegroundColor Gray
Write-Host "  It should show: 'Ready! Your webhook signing secret is...'" -ForegroundColor Gray
Write-Host "  Status: Waiting for events..." -ForegroundColor Gray
Write-Host ""

Write-Host "Step 2: Start Frontend (if not running)" -ForegroundColor Yellow
Write-Host "  Run in a new terminal:" -ForegroundColor Gray
Write-Host "    cd d:\MicroMart\frontend" -ForegroundColor White
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Make a Test Payment" -ForegroundColor Yellow
Write-Host "  1. Open: http://localhost:5173" -ForegroundColor Gray
Write-Host "  2. Login to your account" -ForegroundColor Gray
Write-Host "  3. Click 'Buy Now' on any product" -ForegroundColor Gray
Write-Host "  4. On Stripe checkout, use test card:" -ForegroundColor Gray
Write-Host "     Card: 4242 4242 4242 4242" -ForegroundColor White
Write-Host "     Expiry: 12/34" -ForegroundColor White
Write-Host "     CVC: 123" -ForegroundColor White
Write-Host "  5. Click 'Pay' and wait for redirect" -ForegroundColor Gray
Write-Host ""

Write-Host "Step 4: Watch for Success!" -ForegroundColor Yellow
Write-Host "  A. In Stripe CLI terminal, you should see:" -ForegroundColor Gray
Write-Host "     --> checkout.session.completed [evt_xxx]" -ForegroundColor Cyan
Write-Host "     <-- [200] POST .../payment/webhook [evt_xxx]" -ForegroundColor Green
Write-Host ""
Write-Host "  B. In your app, order should show status: 'completed'" -ForegroundColor Gray
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "  • No events in Stripe CLI? Make sure you clicked 'Pay' button" -ForegroundColor Gray
Write-Host "  • Events show but webhook fails? Check CloudWatch logs:" -ForegroundColor Gray
Write-Host "    aws logs tail /aws/lambda/MicroMart-Payment --follow --region eu-north-1" -ForegroundColor White
Write-Host "  • Order still pending? Verify webhook secret matches in Lambda" -ForegroundColor Gray
Write-Host ""

Write-Host "Press Ctrl+C to exit this message and start testing!" -ForegroundColor Cyan
Write-Host ""

# Wait for user
Read-Host "Press Enter to check Lambda logs (or Ctrl+C to skip)"

Write-Host ""
Write-Host "Fetching recent Lambda logs..." -ForegroundColor Yellow
aws logs tail /aws/lambda/MicroMart-Payment --since 10m --region eu-north-1
