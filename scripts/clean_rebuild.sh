#!/usr/bin/env bash
set -euo pipefail

# Clean Docker resources for the EpiTrello project and rebuild services.
# Usage:
#   ./scripts/clean_rebuild.sh
#
# Requirement: run from the repository root (where docker-compose.dev.yml lives).

COMPOSE_FILE="docker-compose.dev.yml"
PROJECT_PREFIX="epitrello"
ENV_FILE=".env"
ENV_FILES=(".env" ".env.example")

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Error: ${COMPOSE_FILE} not found. Run this script from the project root." >&2
  exit 1
fi

echo ">> Stopping and removing compose containers/volumes (file: ${COMPOSE_FILE})"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down -v --remove-orphans || true

echo ">> Removing orphan containers with prefix ${PROJECT_PREFIX}"
docker ps -a --format '{{.ID}} {{.Names}}' | grep -E "${PROJECT_PREFIX}" || true | awk '{print $1}' | xargs -r docker rm -f

echo ">> Removing project images (prefix ${PROJECT_PREFIX})"
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep -E "^${PROJECT_PREFIX}" || true | awk '{print $2}' | xargs -r docker rmi -f

echo ">> Removing project volumes (prefix ${PROJECT_PREFIX})"
docker volume ls --format '{{.Name}}' | grep -E "^${PROJECT_PREFIX}" || true | xargs -r docker volume rm

echo ">> Removing project networks (prefix ${PROJECT_PREFIX})"
docker network ls --format '{{.Name}}' | grep -E "^${PROJECT_PREFIX}" || true | xargs -r docker network rm

# Ensure env files are present (do not delete them)
echo ">> Checking env files"
for f in "${ENV_FILES[@]}"; do
  if [[ -f "${f}" ]]; then
    echo "   - found ${f}"
  else
    echo "   - ${f} missing (create it before running compose)" >&2
  fi
done

echo ">> Rebuilding without cache and starting up"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build --no-cache
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up --build

