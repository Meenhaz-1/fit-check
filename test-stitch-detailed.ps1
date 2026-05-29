# Load API key from .env.local
$envContent = Get-Content .env.local -Raw
$apiKeyMatch = $envContent -match 'GOOGLE_STITCH_API_KEY=(.+)'
$apiKey = $matches[1].Trim()

if (-not $apiKey) {
    Write-Host "ERROR: GOOGLE_STITCH_API_KEY not found" -ForegroundColor Red
    exit 1
}

Write-Host "Testing Stitch API" -ForegroundColor Cyan
Write-Host "=" * 60

$headers = @{
    "X-Goog-Api-Key" = $apiKey
    "Content-Type"   = "application/json"
}

Write-Host "Headers being sent:"
Write-Host "  X-Goog-Api-Key: $($apiKey.Substring(0, 20))..."
Write-Host "  Content-Type: application/json"
Write-Host ""

# Try different request formats
$requests = @(
    @{
        name = "list_projects (original)"
        body = @{ "tool" = "list_projects" } | ConvertTo-Json
    },
    @{
        name = "list_projects with method"
        body = @{ "method" = "list_projects" } | ConvertTo-Json
    },
    @{
        name = "listProjects"
        body = @{ "tool" = "listProjects" } | ConvertTo-Json
    },
    @{
        name = "Direct root"
        body = ""
    }
)

foreach ($request in $requests) {
    Write-Host "Testing: $($request.name)" -ForegroundColor Yellow
    Write-Host "  Request body: $($request.body)"

    try {
        $response = Invoke-WebRequest `
            -Uri "https://stitch.googleapis.com/mcp" `
            -Method POST `
            -Headers $headers `
            -Body $request.body `
            -ContentType "application/json" `
            -ErrorAction Stop

        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "  Response: $($response.Content.Substring(0, 200))"
    }
    catch {
        Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)"

        try {
            $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $streamReader.ReadToEnd()
            Write-Host "  Response: $errorBody"
            $streamReader.Close()
        }
        catch {
            Write-Host "  (Could not read error details)"
        }
    }
    Write-Host ""
}

Write-Host "=" * 60
