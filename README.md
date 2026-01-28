# EpiTrello

[![codecov](https://codecov.io/gh/math974/EpiTrello/branch/main/graph/badge.svg)](https://codecov.io/gh/math974/EpiTrello)

A modern Trello clone with a GraphQL API, a Next.js frontend, and a Postgres database.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development without Docker)
- Git

## Environment Files

- `.env.dev` is used for local development with Docker.
- `.env.prod` is used for production with Docker.
- `.env.dev.example` and `.env.prod.example` show the expected variables with placeholder values.

Never commit real `.env` files to version control. Only the `.example` files are tracked.

## Services Overview

When running the dev compose file, you get:

- **Postgres**: `localhost:5432`
- **Backend (GraphQL API)**: `http://localhost:4000/graphql`
- **Backend Tests (watch)**: runs unit tests on file change
- **Backend Coverage (HTML)**: `http://localhost:7331`
- **Frontend (Next.js)**: `http://localhost:3000`
- **pgAdmin**: `http://localhost:5050`
- **Docs (SpectaQL)**: `http://localhost:4400`
- **Prisma Studio**: `http://localhost:5555`

Prisma Studio is a web UI to browse and edit your database tables during development.

## Auto Reload (Docker, Development)

Hot reload is enabled for both backend and frontend in the dev Docker setup.  
When you edit files in `backend/` or `frontend/`, the containers will automatically reload.

## Quick Start (Docker, Development)

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev up --build
```

### Backend Unit Tests (Watch + HTML Coverage)

Start the test watcher:

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev up backend-tests
```

Open the HTML coverage report:

- `http://localhost:7331`
- Files are generated in `backend/coverage/lcov-report`.

Stop services:

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev down
```

Reset everything (containers + volumes):

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev down -v
```

## Helper Script (Clean Rebuild)

The script `scripts/clean_rebuild.sh` removes containers, volumes, networks, and images for a clean rebuild.

### Development

```bash
./scripts/clean_rebuild.sh
```

### Production

```bash
./scripts/clean_rebuild.sh --prod
```

## pgAdmin Access

Open `http://localhost:5050` and log in with the values from:

- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD`

The Postgres server is pre-registered inside pgAdmin.  
If you don’t see tables, the database is empty and migrations/seeds have not been run yet.

## Local Development (Without Docker)

You can run the services locally if you have Postgres installed.

### Backend

```bash
cd backend
npm install

cat > .env << ENV_EOF
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://username:password@localhost:5432/epitrello?schema=public
JWT_SECRET=dev_jwt_secret_change_in_production
CORS_ORIGIN=http://localhost:3000
ENV_EOF

npm run dev
```

### Frontend

```bash
cd frontend
npm install

cat > .env.local << ENV_EOF
NEXT_PUBLIC_GRAPHQL_API=http://localhost:4000/graphql
ENV_EOF

npm run dev
```

## Production (Docker Compose)

1. Create the file:
   ```bash
   cp .env.prod.example .env.prod
   nano .env.prod
   ```

2. Start services:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```

## Environment Variables Reference (Development)

Common variables used by `docker-compose.dev.yml`:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `NEXT_PUBLIC_GRAPHQL_API`
- `PGADMIN_DEFAULT_EMAIL`
- `PGADMIN_DEFAULT_PASSWORD`

## Troubleshooting

### Tables Not Visible in pgAdmin

This usually means the database has not been migrated/seeded yet.  
Run the migrations or seeds from the backend (once they exist).

## Database Migrations (Prisma)

You must run Prisma migrations to create/update database tables after schema changes.

### Docker (recommended)
```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev exec backend \
  npx prisma migrate dev --name init
```

### Local (no Docker)
```bash
cd backend
export DATABASE_URL="postgresql://user:password@localhost:5432/epitrello?schema=public"
npx prisma migrate dev --name init
```

> If your `DATABASE_URL` uses `postgres:5432`, run the migration inside Docker.  
> `postgres` is the Docker service name, not available locally.

### Port Already in Use

Change `BACKEND_PORT` or `FRONTEND_PORT` inside `.env.dev` and restart.

### Permission Issues (Linux)

If you see permission errors with volumes:

```bash
sudo chown -R $USER:$USER .
```

## Next Steps

- Read [docs/README.md](docs/README.md)
- Start building features!
