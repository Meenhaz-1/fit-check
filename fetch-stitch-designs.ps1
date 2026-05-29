# Load API key from .env.local
$envContent = Get-Content .env.local -Raw
$apiKeyMatch = $envContent -match 'GOOGLE_STITCH_API_KEY=(.+)'
$apiKey = $matches[1].Trim()

if (-not $apiKey) {
    Write-Host "ERROR: GOOGLE_STITCH_API_KEY not found" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching Stitch Designs" -ForegroundColor Cyan
Write-Host "=" * 60

$headers = @{
    "X-Goog-Api-Key" = $apiKey
    "Content-Type"   = "application/json"
}

# Step 1: List all projects
Write-Host "Step 1: Listing Stitch Projects..." -ForegroundColor Yellow

$body = @{
    "jsonrpc" = "2.0"
    "method"  = "list_projects"
    "params"  = @{}
    "id"      = 1
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest `
        -Uri "https://stitch.googleapis.com/mcp" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -UseBasicParsing

    $data = $response.Content | ConvertFrom-Json

    if ($data.error) {
        Write-Host "Error: $($data.error.message)" -ForegroundColor Red
        exit 1
    }

    Write-Host "Status: 200 OK" -ForegroundColor Green
    Write-Host "Projects:" -ForegroundColor Green
    Write-Host ($data.result | ConvertTo-Json -Depth 10)

    # Save projects to variable for next step
    $projects = $data.result.projects

    if ($projects) {
        Write-Host ""
        Write-Host "Found $($projects.Count) projects:" -ForegroundColor Cyan
        foreach ($project in $projects) {
            Write-Host "  - $($project.displayName)" -ForegroundColor Green
            Write-Host "    ID: $($project.name)"
        }
    } else {
        Write-Host "No projects found" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error fetching projects: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 60
Write-Host "Copy the output above and share it with Claude!"
