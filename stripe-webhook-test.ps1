#!/usr/bin/env pwsh
# Stripe Webhook Testing and Verification Script

param(
    [switch]$Install,
    [switch]$Setup,
    [switch]$Test
)

$ErrorActionPreference = "Continue"
$API_GATEWAY_URL = "https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod"
$REGION = "eu-north-1"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "    $Text" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Test-StripeCliInstalled {
    try {
        $version = stripe --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Stripe CLI installed: $version" -ForegroundColor Green
            return $true
        }
    } catch {}
    Write-Host "❌ Stripe CLI not installed" -ForegroundColor Red
    return $false
}

function Install-StripeCli {
    Write-Header "Installing Stripe CLI"
    
    if (Test-StripeCliInstalled) {
        Write-Host "Stripe CLI already installed. Skipping..." -ForegroundColor Yellow
        return
    }

    Write-Host "Installing via Scoop..." -ForegroundColor Yellow
    
    # Check if Scoop is installed
    try {
        scoop --version | Out-Null
    } catch {
        Write-Host "❌ Scoop not found. Please install Scoop first:" -ForegroundColor Red
        Write-Host "   Run: iwr -useb get.scoop.sh | iex" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or download Stripe CLI manually from:" -ForegroundColor Yellow
        Write-Host "   https://github.com/stripe/stripe-cli/releases/latest" -ForegroundColor Cyan
        return
    }

    # Install Stripe CLI via Scoop
    Write-Host "Adding Stripe bucket..." -ForegroundColor Yellow
    scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git 2>&1 | Out-Null
    
    Write-Host "Installing Stripe CLI..." -ForegroundColor Yellow
    scoop install stripe
    
    if (Test-StripeCliInstalled) {
        Write-Host "✅ Stripe CLI installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Installation failed. Please install manually." -ForegroundColor Red
    }
}

function Setup-StripeWebhook {
    Write-Header "Stripe Webhook Setup"
    
    if (-not (Test-StripeCliInstalled)) {
        Write-Host "❌ Stripe CLI not installed. Run: .\stripe-webhook-test.ps1 -Install" -ForegroundColor Red
        return
    }

    Write-Host "Step 1: Login to Stripe..." -ForegroundColor Yellow
    Write-Host "This will open your browser for authentication." -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to continue"
    
    stripe login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed" -ForegroundColor Red
        return
    }
    
    Write-Host "✅ Logged in successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Step 2: Start webhook forwarding..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run this command in a separate terminal window:" -ForegroundColor Cyan
    Write-Host "   stripe listen --forward-to $API_GATEWAY_URL/payment/webhook" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT: Copy the webhook signing secret that appears!" -ForegroundColor Yellow
    Write-Host "It will look like: whsec_xxxxxxxxxxxxxxxxxxxxx" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Step 3: Update Lambda with new secret..." -ForegroundColor Yellow
    Write-Host "1. Edit: d:\MicroMart\lambda\MicroMart.Payment\src\MicroMart.Payment\Function.cs" -ForegroundColor Gray
    Write-Host "2. Update STRIPE_WEBHOOK_SECRET (line 19) with the new secret" -ForegroundColor Gray
    Write-Host "3. Deploy Lambda:" -ForegroundColor Gray
    Write-Host "   cd d:\MicroMart\lambda\MicroMart.Payment\src\MicroMart.Payment" -ForegroundColor White
    Write-Host "   dotnet lambda deploy-function MicroMart-Payment --region $REGION" -ForegroundColor White
    Write-Host ""
}

function Test-WebhookEndpoint {
    Write-Header "Testing Webhook Configuration"
    
    # Test 1: Webhook endpoint accessibility
    Write-Host "[1/5] Testing webhook endpoint accessibility..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest `
            -Uri "$API_GATEWAY_URL/payment/webhook" `
            -Method POST `
            -Body '{"type":"test"}' `
            -ContentType "application/json" `
            -UseBasicParsing `
            -ErrorAction Stop
        Write-Host "✅ Endpoint accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 400 -or $_.Exception.Response.StatusCode.value__ -eq 500) {
            Write-Host "✅ Endpoint accessible (Expected error for test payload)" -ForegroundColor Green
        } else {
            Write-Host "❌ Endpoint not accessible: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # Test 2: CORS configuration
    Write-Host "[2/5] Testing CORS configuration..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest `
            -Uri "$API_GATEWAY_URL/payment/webhook" `
            -Method OPTIONS `
            -UseBasicParsing `
            -ErrorAction Stop
        $corsHeader = $response.Headers['Access-Control-Allow-Origin']
        if ($corsHeader) {
            Write-Host "✅ CORS configured (Allow-Origin: $corsHeader)" -ForegroundColor Green
        } else {
            Write-Host "⚠️ CORS headers missing" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ CORS test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    # Test 3: Lambda function status
    Write-Host "[3/5] Checking Lambda function status..." -ForegroundColor Yellow
    try {
        $lambdaStatus = aws lambda get-function `
            --function-name MicroMart-Payment `
            --region $REGION `
            --query 'Configuration.[State, LastUpdateStatus]' `
            --output json | ConvertFrom-Json
        
        if ($lambdaStatus[0] -eq "Active" -and $lambdaStatus[1] -eq "Successful") {
            Write-Host "✅ Lambda Active and up-to-date" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Lambda State: $($lambdaStatus[0]), LastUpdate: $($lambdaStatus[1])" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Failed to check Lambda status: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 4: API Gateway routes
    Write-Host "[4/5] Verifying API Gateway routes..." -ForegroundColor Yellow
    try {
        $routes = aws apigatewayv2 get-routes `
            --api-id kpk440vdkf `
            --region $REGION `
            --query 'Items[?contains(RouteKey, `payment`)].RouteKey' `
            --output json | ConvertFrom-Json
        
        $requiredRoutes = @("POST /payment/webhook", "POST /payment/create-checkout")
        $allPresent = $true
        foreach ($route in $requiredRoutes) {
            if ($routes -contains $route) {
                Write-Host "  ✓ $route" -ForegroundColor Gray
            } else {
                Write-Host "  ✗ $route MISSING" -ForegroundColor Red
                $allPresent = $false
            }
        }
        
        if ($allPresent) {
            Write-Host "✅ All required routes present" -ForegroundColor Green
        } else {
            Write-Host "❌ Some routes are missing" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Failed to check routes: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 5: DynamoDB table access
    Write-Host "[5/5] Checking DynamoDB tables..." -ForegroundColor Yellow
    try {
        $tables = aws dynamodb list-tables --region $REGION --query 'TableNames' --output json | ConvertFrom-Json
        $requiredTables = @("MicroMart-Orders", "MicroMart-Products")
        $tablesPresent = $true
        
        foreach ($table in $requiredTables) {
            if ($tables -contains $table) {
                Write-Host "  ✓ $table" -ForegroundColor Gray
            } else {
                Write-Host "  ✗ $table MISSING" -ForegroundColor Red
                $tablesPresent = $false
            }
        }
        
        if ($tablesPresent) {
            Write-Host "✅ All required tables present" -ForegroundColor Green
        } else {
            Write-Host "❌ Some tables are missing" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Failed to check tables: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Instructions {
    Write-Header "Stripe Webhook - Complete Setup"
    
    Write-Host "📋 Choose an option:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Install Stripe CLI" -ForegroundColor White
    Write-Host "     .\stripe-webhook-test.ps1 -Install" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Setup webhook forwarding (after install)" -ForegroundColor White
    Write-Host "     .\stripe-webhook-test.ps1 -Setup" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Test webhook endpoint and configuration" -ForegroundColor White
    Write-Host "     .\stripe-webhook-test.ps1 -Test" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📖 For detailed instructions, see: STRIPE_WEBHOOK_FIX.md" -ForegroundColor Cyan
    Write-Host ""
    
    # Check current status
    Write-Host "Current Status:" -ForegroundColor Yellow
    if (Test-StripeCliInstalled) {
        Write-Host "  ✅ Stripe CLI installed" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Stripe CLI not installed" -ForegroundColor Red
    }
    Write-Host ""
}

# Main execution
if ($Install) {
    Install-StripeCli
} elseif ($Setup) {
    Setup-StripeWebhook
} elseif ($Test) {
    Test-WebhookEndpoint
} else {
    Show-Instructions
}
