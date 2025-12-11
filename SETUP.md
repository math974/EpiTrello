# EpiTrello Setup Guide

This guide will help you set up and run the EpiTrello project.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development without Docker)
- Git

## Quick Start with Docker (Recommended)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd EpiTrello
```

### 2. Configure Environment Variables

**IMPORTANT**: A `.env.dev` file is already provided with default development values. 

If you need to customize the configuration:

```bash
# View the current configuration
cat .env.dev

# Edit if needed
nano .env.dev
```

> ⚠️ **Note**: The `.env.dev` and `.env.prod` files are git-ignored and should never be committed to version control. Only the `.example` files are tracked.

### 3. Start the Development Environment

```bash
docker-compose -f docker-compose.dev.yml --env-file .env.dev up --build
```

This will start:
- MongoDB on port 27017
- Backend (GraphQL API) on port 4000
- Frontend (Next.js) on port 3000

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend GraphQL Playground**: http://localhost:4000/graphql
- **MongoDB**: localhost:27017

### 5. Stop the Services

Press `Ctrl+C` in the terminal, then run:

```bash
docker-compose -f docker-compose.dev.yml down
```

To also remove volumes (database data):

```bash
docker-compose -f docker-compose.dev.yml down -v
```

## Local Development (Without Docker)

If you prefer to run services locally without Docker:

### Prerequisites
- MongoDB installed and running locally
- Node.js 20+

### Backend Setup

```bash
cd backend
npm install

# Create environment file
cat > .env << EOF
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://epitrello:epitrello_dev_password@localhost:27017/epitrello?authSource=admin
JWT_SECRET=dev_jwt_secret_change_in_production
CORS_ORIGIN=http://localhost:3000
EOF

# Start the backend
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_GRAPHQL_API=http://localhost:4000/graphql
EOF

# Start the frontend
npm run dev
```

## Production Deployment

### 1. Configure Production Environment

Create a `.env.prod` file based on the example:

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

**Required**: Fill in all these values:
- `NODE_ENV=production`
- `BACKEND_PORT=4000`
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A strong, unique secret key (use `openssl rand -base64 32` to generate one)
- `CORS_ORIGIN`: Your frontend domain (e.g., `https://your-frontend.com`)
- `FRONTEND_PORT=3000`
- `NEXT_PUBLIC_GRAPHQL_API`: Your backend GraphQL endpoint (e.g., `https://api.your-backend.com/graphql`)

### 2. Deploy with Docker Compose

```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### 3. Deploy to Google Cloud Run

For Cloud Run deployment, see the main README.md deployment section.

## Environment Variables Reference

### Development (.env.dev)

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `MONGO_INITDB_ROOT_USERNAME` | MongoDB root username | `epitrello` |
| `MONGO_INITDB_ROOT_PASSWORD` | MongoDB root password | `epitrello_dev_password` |
| `MONGO_INITDB_DATABASE` | MongoDB database name | `epitrello` |
| `NODE_ENV` | Node environment | `development` |
| `BACKEND_PORT` | Backend port (host) | `4000` |
| `MONGODB_URI` | MongoDB connection string | See example file |
| `JWT_SECRET` | JWT signing secret | `dev_jwt_secret_change_in_production` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `FRONTEND_PORT` | Frontend port (host) | `3000` |
| `NEXT_PUBLIC_GRAPHQL_API` | GraphQL API endpoint | `http://localhost:4000/graphql` |

### Production (.env.prod)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `BACKEND_PORT` | Backend port (host) | `4000` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/epitrello` |
| `JWT_SECRET` | JWT signing secret | Strong random string |
| `CORS_ORIGIN` | Allowed CORS origin | `https://your-domain.com` |
| `FRONTEND_PORT` | Frontend port (host) | `3000` |
| `NEXT_PUBLIC_GRAPHQL_API` | GraphQL API endpoint | `https://api.your-domain.com/graphql` |

## Troubleshooting

### Port Already in Use

If you get an error about ports already in use, you can change the ports in your `.env.dev` file:

```env
BACKEND_PORT=4001
FRONTEND_PORT=3001
```

### MongoDB Connection Issues

Make sure MongoDB is running and accessible. For Docker, the service name `mongodb` is used as the hostname.

### Hot Reload Not Working

If hot reload isn't working in Docker:
1. Make sure the volumes are correctly mounted
2. Try rebuilding: `docker-compose -f docker-compose.dev.yml up --build`

### Permission Issues

On Linux, if you encounter permission issues with node_modules:
```bash
sudo chown -R $USER:$USER .
```

## Next Steps

- Check the [README.md](README.md) for more information
- Read the [documentation](docs/README.md) for API details
- Start building features!

## Security Notes

⚠️ **Important Security Reminders**:

1. Never commit `.env`, `.env.dev`, or `.env.prod` files to version control
2. Change all default passwords in production
3. Use strong, unique JWT secrets in production
4. Enable MongoDB authentication in production
5. Use HTTPS in production
6. Regularly update dependencies

## Support

For issues and questions, please open an issue on the GitHub repository.

