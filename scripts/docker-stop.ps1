$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker no está disponible. Inicia Docker Desktop para limpiar Vector."
}

# Elimina solo contenedores, red, volúmenes efímeros e imágenes creadas por este Compose.
# MongoDB Atlas es externo y nunca se modifica.
docker compose --project-name vector down --rmi local --volumes --remove-orphans
if ($LASTEXITCODE -ne 0) { throw "No fue posible limpiar los recursos Docker de Vector." }
Write-Host "Se eliminaron los recursos Docker de Vector. MongoDB no fue modificada."
