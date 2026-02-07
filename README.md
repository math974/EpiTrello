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
- **MinIO API**: `http://localhost:9000`
- **MinIO Console**: `http://localhost:9001`

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
- `MINIO_ROOT_USER` (default: `minioadmin`)
- `MINIO_ROOT_PASSWORD` (default: `minioadmin`)
- `MINIO_PORT` (default: `9000`)
- `MINIO_CONSOLE_PORT` (default: `9001`)
- `MINIO_ENDPOINT` (default: `localhost` for local dev, `minio` for Docker) - Internal endpoint for backend operations
- `MINIO_EXTERNAL_ENDPOINT` (default: `localhost`) - External endpoint for presigned URLs (used by frontend)
- `MINIO_EXTERNAL_PORT` (default: `9000`) - External port for presigned URLs
- `MINIO_USE_SSL` (default: `false`)
- `MINIO_ACCESS_KEY` (default: `minioadmin`)
- `MINIO_SECRET_KEY` (default: `minioadmin`)
- `MINIO_BUCKET_NAME` (default: `app-uploads`)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID (optional, required for Google OAuth)
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret (optional, required for Google OAuth)
- `GITHUB_CLIENT_ID` - GitHub OAuth Client ID (optional, required for GitHub OAuth)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth Client Secret (optional, required for GitHub OAuth)
- `OAUTH_REDIRECT_URI` - OAuth callback URL (default: `http://localhost:4000/auth/{provider}/callback`)
- `FRONTEND_URL` - Frontend URL for OAuth redirects (default: `http://localhost:3000`)

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

## MinIO Object Storage

MinIO is configured as an S3-compatible object storage service for file uploads.

### Access

- **MinIO API**: http://localhost:9000
- **MinIO Console**: http://localhost:9001
- **Default credentials**: minioadmin / minioadmin

### Configuration

The `app-uploads` bucket is automatically created on startup with public download access.

**Important**: The backend uses two different endpoints:
- **Internal endpoint** (`MINIO_ENDPOINT`): Used for backend operations (delete, copy, move, list, metadata). In Docker, this is `minio` (the Docker service name). For local dev without Docker, use `localhost`.
- **External endpoint** (`MINIO_EXTERNAL_ENDPOINT`): Used for generating presigned URLs that the frontend will use. This should always be `localhost` (or your public domain) so the frontend can access MinIO from outside Docker.

This separation ensures that:
- Backend can communicate with MinIO using the Docker service name internally
- Frontend receives presigned URLs pointing to `localhost:9000` which it can access from the browser

Both endpoints are automatically configured in `docker-compose.dev.yml`.

### Usage in Backend

The `StorageService` provides methods for:
- Generating presigned upload URLs
- Generating presigned download URLs
- Deleting objects

Example:
```typescript
// Inject StorageService
constructor(private readonly storageService: StorageService) {}

// Generate upload URL
const uploadUrl = await this.storageService.getUploadUrl('path/to/file.jpg', 3600);

// Generate download URL
const downloadUrl = await this.storageService.getDownloadUrl('path/to/file.jpg', 3600);

// Delete object
await this.storageService.deleteObject('path/to/file.jpg');
```

## OAuth Authentication

The application supports OAuth authentication via Google and GitHub. OAuth uses REST endpoints while the rest of the API uses GraphQL.

### Configuration

1. **Google OAuth Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:4000/auth/google/callback` (or your production URL)
   - Copy the Client ID and Client Secret

2. **GitHub OAuth Setup**:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Set Application name
   - Set Homepage URL: `http://localhost:3000` (or your frontend URL)
   - Set Authorization callback URL: `http://localhost:4000/auth/github/callback` (or your backend URL)
   - Copy the Client ID and Client Secret

3. **Environment Variables**:
   Add these to your `.env.dev` or `.env.prod`:
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   OAUTH_REDIRECT_URI=http://localhost:4000/auth/{provider}/callback
   FRONTEND_URL=http://localhost:3000
   ```

### OAuth Flow

1. User clicks "Login with Google" or "Login with GitHub"
2. Frontend redirects to `GET /auth/google` or `GET /auth/github`
3. User authenticates with the provider
4. Provider redirects to callback endpoint
5. Backend creates/logs in user and generates JWT tokens
6. User is redirected to frontend with tokens in URL: `/auth/callback?accessToken=...&refreshToken=...`
7. Frontend stores tokens and user is logged in

### Database

OAuth accounts are stored in the `OAuthAccount` table with:
- `provider`: 'google' or 'github'
- `providerUserId`: Unique ID from the OAuth provider
- `userId`: Foreign key to User table
- Unique constraint on `(provider, providerUserId)`

Users created via OAuth have `passwordHash` set to `null`.

### REST Endpoints

- `GET /auth/google` - Redirects to Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/github` - Redirects to GitHub OAuth
- `GET /auth/github/callback` - GitHub OAuth callback

See [POSTMAN_OAUTH.md](POSTMAN_OAUTH.md) for detailed Postman testing instructions.

## Next Steps

- Read [docs/README.md](docs/README.md)
- Start building features!
