param(
    [string]$EnvFile = ".env"
)

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root $EnvFile

if (Test-Path -LiteralPath $envPath) {
    Get-Content -LiteralPath $envPath | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }

        $name, $value = $line.Split("=", 2)
        $name = $name.Trim()
        $value = $value.Trim().Trim('"').Trim("'")
        if ($name) {
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

Set-Location -LiteralPath (Join-Path $root "backend")
mvn spring-boot:run

