# Deploy all Lambda functions
$lambdas = @(
    @{Name="MicroMart-Users"; Path="d:\MicroMart\lambda\MicroMart.Users\src\MicroMart.Users"},
    @{Name="MicroMart-Products"; Path="d:\MicroMart\lambda\MicroMart.Products\src\MicroMart.Products"},
    @{Name="MicroMart-Payment"; Path="d:\MicroMart\lambda\MicroMart.Payment\src\MicroMart.Payment"},
    @{Name="MicroMart-Upload"; Path="d:\MicroMart\lambda\MicroMart.Upload\src\MicroMart.Upload"},
    @{Name="MicroMart-Authorizer"; Path="d:\MicroMart\lambda\MicroMart.Authorizer\src\MicroMart.Authorizer"}
)

foreach ($lambda in $lambdas) {
    Write-Host "`nDeploying $($lambda.Name)..." -ForegroundColor Cyan
    cd $lambda.Path
    
    dotnet publish -c Release -o publish --runtime linux-x64
    Compress-Archive -Path publish\* -DestinationPath function.zip -Force
    
    aws lambda update-function-code `
        --function-name $lambda.Name `
        --zip-file fileb://function.zip `
        --region eu-north-1
    
    Write-Host "✅ $($lambda.Name) deployed" -ForegroundColor Green
}

Write-Host "`n🎉 All Lambda functions deployed!" -ForegroundColor Green