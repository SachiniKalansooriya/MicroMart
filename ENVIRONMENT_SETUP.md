# Environment Setup Guide

## Files Created/Updated

### 1. `.env` Configuration
- **Location**: `frontend/.env`
- **Purpose**: Stores environment-specific variables
- **Content**: 
  - API Gateway URL
  - Stripe Secret Key
  - Stripe Webhook Secret
- **Security**: Already in `.gitignore` - will NOT be committed

### 2. `.env.example` Template
- **Location**: `frontend/.env.example`
- **Purpose**: Template for other developers
- **Content**: Placeholder values
- **Security**: Safe to commit - contains no secrets

### 3. `.gitignore` Files
- **Root**: `d:\MicroMart\.gitignore`
- **Frontend**: `frontend/.gitignore` (updated)
- **Purpose**: Prevent sensitive files from being committed

### 4. README.md
- **Location**: Root directory
- **Content**: Complete setup and deployment instructions
- **Includes**: 
  - Architecture overview
  - Setup steps
  - AWS configuration
  - Environment variables guide
  - Security best practices

## Environment Variables

### Current Configuration

```env
VITE_API_BASE_URL=https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod
```

**Note**: Stripe keys are configured ONLY in AWS Lambda environment variables (MicroMart-Payment function), NOT in frontend .env file.

### For Public Repository

**Before pushing to GitHub:**

1. The actual `.env` file with real URLs will NOT be committed (it's in `.gitignore`)
2. Only `.env.example` with placeholder values will be committed
3. Users need to create their own `.env` file with their AWS resources

### Code Changes Made

All hardcoded URLs have been replaced with:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'fallback-url';
```

**Files Updated:**
- ✅ `src/services/authService.ts`
- ✅ `src/services/productService.ts`
- ✅ `src/services/paymentService.ts`
- ✅ `src/services/s3Service.ts`
- ✅ `src/pages/AdminDashboard.tsx`
- ✅ `src/pages/CustomersPage.tsx`
- ✅ `src/pages/AdminOrders.tsx` (already using env var)

## Before Making Repository Public

### ⚠️ Important Security Checklist

1. **Remove Sensitive Data**
   ```bash
   # Check for any committed secrets
   git log --all --full-history --source -- "*env*"
   ```

2. **Verify .gitignore**
   ```bash
   # Test what will be committed
   git status
   git add -n .
   ```

3. **Clean Git History** (if secrets were previously committed)
   ```bash
   # Use BFG Repo-Cleaner or git-filter-repo to remove secrets
   # from git history before making public
   ```

4. **Update Documentation**
   - ✅ README.md is ready
   - ✅ .env.example is ready
   - ✅ Setup instructions included

5. **Test with Fresh Clone**
   ```bash
   # Clone to a new directory and verify setup works
   git clone <repo-url> test-clone
   cd test-clone/frontend
   cp .env.example .env
   # Edit .env with test values
   npm install
   npm run dev
   ```

## For New Developers

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/SachiniKalansooriya/MicroMart.git
   cd MicroMart/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your AWS resources**
   ```env
   VITE_API_BASE_URL=https://your-api-id.execute-api.your-region.amazonaws.com/prod
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

## AWS Resources Needed

Users will need to set up:
1. **API Gateway** - HTTP API with routes
2. **Lambda Functions** - 7 functions (Auth, Products, Payment, etc.)
3. **DynamoDB Tables** - Users, Products, Orders
4. **S3 Bucket** - For product images
5. **Stripe Account** - For payments
6. **IAM Roles** - For Lambda execution

All detailed in README.md!

## Security Best Practices Applied

✅ Environment variables for all external URLs
✅ No hardcoded secrets in code
✅ .gitignore properly configured
✅ .env.example for documentation
✅ Comprehensive setup guide
✅ Security warnings in README
✅ Fallback URLs for development

## Next Steps

1. Review all changes
2. Test the application with `.env` configuration
3. Verify `.gitignore` is working
4. Consider using AWS Secrets Manager for production
5. Make repository public when ready!
