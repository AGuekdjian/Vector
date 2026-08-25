$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

if (-not (Test-Path ".env.local")) {
  throw "Falta .env.local. Créelo a partir de .env.example antes de iniciar Docker."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker no está disponible. Inicia Docker Desktop y vuelve a ejecutar este script."
}

docker compose --project-name vector up --build --detach
if ($LASTEXITCODE -ne 0) { throw "Docker Compose no pudo iniciar Vector." }

for ($attempt = 1; $attempt -le 36; $attempt++) {
  $health = docker inspect --format "{{.State.Health.Status}}" vector-app 2>$null
  if ($health -eq "healthy") {
    Write-Host "Vector está disponible en http://localhost:3000"
    exit 0
  }
  if ($health -eq "unhealthy") {
    docker compose --project-name vector logs --tail 100 app
    throw "El contenedor inició, pero el healthcheck falló."
  }
  Start-Sleep -Seconds 5
}

docker compose --project-name vector logs --tail 100 app
throw "Vector no alcanzó el estado healthy dentro del tiempo esperado."
