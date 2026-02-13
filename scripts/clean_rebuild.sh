#!/usr/bin/env bash
set -euo pipefail

# Clean Docker resources for the EpiTrello project and rebuild services.
# Removes only containers (and related resources) created from the chosen compose file.
# Usage:
#   ./scripts/clean_rebuild.sh [--prod] [--full] [--clean-only] [--help]
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
# With --clean-only:
#   only delete containers/images/networks (and volumes if --full); do not rebuild or start
#
# Requirement: run from the repository root (where docker-compose.*.yml lives).

COMPOSE_FILE="docker-compose.dev.yml"
PROJECT_PREFIX="epitrello"
ENV_FILE=".env.dev"
ENV_FILES=(".env.dev" ".env.dev.example")
FULL_CLEAN=false
CLEAN_ONLY=false

show_help() {
  cat <<EOF
Usage: $0 [--prod] [--full] [--clean-only] [--help]

Options:
  --prod       Use docker-compose.prod.yml with .env.prod
  --full       Remove volumes (destructive)
  --clean-only Only delete containers/images/networks; do not rebuild or start
  --help       Show this help

Default: docker-compose.dev.yml and .env.dev.
Without --clean-only: after cleanup, rebuilds without cache and runs docker compose up --build.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prod)
      COMPOSE_FILE="docker-compose.prod.yml"
      ENV_FILE=".env.prod"
      ENV_FILES=(".env.prod" ".env.prod.example")
      shift
      ;;
    --full)
      FULL_CLEAN=true
      shift
      ;;
    --clean-only)
      CLEAN_ONLY=true
      shift
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
done

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "Error: ${COMPOSE_FILE} not found. Run this script from the project root." >&2
  exit 1
fi

echo ">> Stopping and removing all containers from compose file: ${COMPOSE_FILE}"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down --remove-orphans || true

echo ">> Removing any leftover containers with prefix ${PROJECT_PREFIX}"
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

if [[ "${CLEAN_ONLY}" == "true" ]]; then
  echo ">> Clean only (--clean-only): done. Not rebuilding or starting."
  exit 0
fi

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

