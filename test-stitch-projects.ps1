# Load API key from .env.local
$envContent = Get-Content .env.local -Raw
$apiKeyMatch = $envContent -match 'GOOGLE_STITCH_API_KEY=(.+)'
$apiKey = $matches[1].Trim()

if (-not $apiKey) {
    Write-Host "ERROR: GOOGLE_STITCH_API_KEY not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "Google Stitch Projects" -ForegroundColor Cyan
Write-Host "============================================================"

$headers = @{
    "X-Goog-Api-Key" = $apiKey
    "Content-Type"   = "application/json"
}

$body = @{
    "tool" = "list_projects"
} | ConvertTo-Json

Write-Host "API Key (first 20 chars): $($apiKey.Substring(0, 20))..."
Write-Host "Fetching projects..."
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "https://stitch.googleapis.com/mcp" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json"

    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Response:"
    Write-Host $response.Content

    $data = $response.Content | ConvertFrom-Json
    Write-Host ""
    Write-Host "Projects Found:" -ForegroundColor Green
    if ($data.projects) {
        $data.projects | ForEach-Object {
            Write-Host "  - $($_.displayName) (ID: $($_.name))"
        }
    } else {
        Write-Host "  (No projects found)"
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "Share the output above!"
