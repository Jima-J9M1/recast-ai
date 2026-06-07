param([string]$SqlFile)

$lines = Get-Content .env.local
function Get-EnvVal($key) {
  $line = ($lines | Where-Object { $_ -match "^\s*$key\s*=" } | Select-Object -First 1)
  if (-not $line) { return "" }
  return ($line -split "=", 2)[1].Trim()
}

$url   = Get-EnvVal "NEXT_PUBLIC_SUPABASE_URL"
$token = Get-EnvVal "SUPABASE_ACCESS_TOKEN"
$ref   = $url.Replace("https://","").Split(".")[0]

$sql = Get-Content $SqlFile -Raw

$body = @{ query = $sql } | ConvertTo-Json -Depth 3
$resp = Invoke-RestMethod -Method Post `
  -Uri "https://api.supabase.com/v1/projects/$ref/database/query" `
  -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body

Write-Host ($resp | ConvertTo-Json)
