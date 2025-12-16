@echo off
echo Testing PUT /orders/{orderId}/status endpoint

REM Get admin token from cognito
aws cognito-idp admin-initiate-auth --user-pool-id eu-north-1_xnEYdlJAo --client-id 32oqkfuumdcvfcm5l9cbjq78ic --auth-flow ADMIN_NO_SRP_AUTH --auth-parameters USERNAME=admin@micromart.com,PASSWORD=Admin@123 --region eu-north-1 --query "AuthenticationResult.IdToken" --output text > admin-token.txt

set /p TOKEN=<admin-token.txt

curl -v -X PUT "https://kpk440vdkf.execute-api.eu-north-1.amazonaws.com/prod/orders/aad1daa1-de92-4a56-8eaf-4c6a300ff948/status" ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -d "{\"status\":\"shipped\"}"

del admin-token.txt
