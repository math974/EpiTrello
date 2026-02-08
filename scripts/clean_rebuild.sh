#!/usr/bin/env bash
set -euo pipefail

# Clean Docker resources for the EpiTrello project and rebuild services.
# Usage:
#   ./scripts/clean_rebuild.sh [--prod] [--full] [--help]
#
# Defaults:
#   compose: docker-compose.dev.yml
#   env file: .env.dev
#   volumes: keep
#
# With --prod:
#   compose: docker-compose.prod.yml
#   env file: .env.prod
#
# With --full:
#   removes volumes as well
#
# Requirement: run from the repository root (where docker-compose.*.yml lives).

COMPOSE_FILE="docker-compose.dev.yml"
PROJECT_PREFIX="epitrello"
ENV_FILE=".env.dev"
ENV_FILES=(".env.dev" ".env.dev.example")
FULL_CLEAN=false

show_help() {
  cat <<EOF
Usage: $0 [--prod] [--full] [--help]

Options:
  --prod   Use docker-compose.prod.yml with .env.prod
  --full   Remove volumes (destructive)
  --help   Show this help

Default behavior uses docker-compose.dev.yml and .env.dev.
The script:
  - stops/removes containers and networks with prefix '${PROJECT_PREFIX}'
  - keeps volumes by default (use --full to remove volumes)
  - rebuilds images without cache
  - starts with docker compose up --build
EOF
}

if [[ $# -gt 0 ]]; then
  case "$1" in
    --prod)
      COMPOSE_FILE="docker-compose.prod.yml"
      ENV_FILE=".env.prod"
      ENV_FILES=(".env.prod" ".env.prod.example")
      ;;
    --full)
      FULL_CLEAN=true
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      show_help
      exit 1
      ;;
  esac
fi

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Error: ${COMPOSE_FILE} not found. Run this script from the project root." >&2
  exit 1
fi

echo ">> Stopping and removing compose containers (file: ${COMPOSE_FILE})"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down --remove-orphans || true

echo ">> Removing orphan containers with prefix ${PROJECT_PREFIX}"
docker ps -a --format '{{.ID}} {{.Names}}' | grep -E "${PROJECT_PREFIX}" || true | awk '{print $1}' | xargs -r docker rm -f

echo ">> Removing project images (prefix ${PROJECT_PREFIX})"
docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep -E "^${PROJECT_PREFIX}" || true | awk '{print $2}' | xargs -r docker rmi -f

if [[ "${FULL_CLEAN}" == "true" ]]; then
echo ">> Removing project volumes (prefix ${PROJECT_PREFIX})"
docker volume ls --format '{{.Name}}' | grep -E "^${PROJECT_PREFIX}" || true | xargs -r docker volume rm
else
  echo ">> Skipping volume removal (use --full to remove volumes)"
fi

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

# Ensure frontend generated directory exists with correct permissions
echo ">> Ensuring frontend/src/generated directory exists"
GENERATED_DIR="frontend/src/generated"
if [[ ! -d "${GENERATED_DIR}" ]]; then
  mkdir -p "${GENERATED_DIR}"
  echo "   - created ${GENERATED_DIR}"
fi

# Set correct permissions (readable/writable by user and group)
chmod 755 "${GENERATED_DIR}" 2>/dev/null || true
if [[ ! -f "${GENERATED_DIR}/.gitkeep" ]]; then
  touch "${GENERATED_DIR}/.gitkeep"
  echo "   - created .gitkeep"
fi
echo "   - ${GENERATED_DIR} ready"

echo ">> Rebuilding without cache and starting up"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" build --no-cache
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up --build

