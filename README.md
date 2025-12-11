# EpiTrello

A modern Trello clone built with Next.js, GraphQL, and MongoDB Atlas.

## 🏗️ Architecture

```
                +----------------------+
                |   User / Browser     |
                +----------+-----------+
                           |
                           v
              +---------------------------+
              |   Next.js (Cloud Run)    |
              |   Frontend UI            |
              +-------------+-------------+
                            |
                            v
              +---------------------------+
              | GraphQL API (Cloud Run)  |
              +-------------+-------------+
                            |
                            v
           +--------------------------------+
           | MongoDB Atlas Serverless       |
           +--------------------------------+
```

## 📁 Project Structure

```
EpiTrello/
├── backend/              # GraphQL API
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   └── src/
├── frontend/             # Next.js Application
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   └── src/
├── docs/                 # Documentation
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .gitignore
└── .dockerignore
```

## 🚀 Quick Start

> 📖 **For detailed setup instructions, see [SETUP.md](SETUP.md)**

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development without Docker)
- MongoDB Atlas account (for production)
- Google Cloud account (for deployment)

### Development with Docker

1. **Clone the project**
   ```bash
   git clone <repo-url>
   cd EpiTrello
   ```

2. **Start the development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml --env-file .env.dev up --build
   ```
   
   > A `.env.dev` file with default values is already included for quick start.

3. **Access the services**
   - Frontend: http://localhost:3000
   - Backend GraphQL: http://localhost:4000/graphql
   - MongoDB: localhost:27017

### Local Development (without Docker)

#### Backend

```bash
cd backend
npm install

# Create and configure environment file
cat > .env << EOF
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://epitrello:epitrello_dev_password@localhost:27017/epitrello?authSource=admin
JWT_SECRET=dev_jwt_secret_change_in_production
CORS_ORIGIN=http://localhost:3000
EOF

npm run dev
```

#### Frontend

```bash
cd frontend
npm install

# Create and configure environment file
cat > .env.local << EOF
NEXT_PUBLIC_GRAPHQL_API=http://localhost:4000/graphql
EOF

npm run dev
```

## 🐳 Docker

### Development Environment
```bash
# The .env.dev file is already provided with default values
# Start services directly
docker-compose -f docker-compose.dev.yml --env-file .env.dev up --build
```

### Production Environment
```bash
# Create .env.prod from the example and fill with your production values
cp .env.prod.example .env.prod
nano .env.prod

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Stop Services
```bash
# Development
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose -f docker-compose.prod.yml down

# With volume cleanup
docker-compose -f docker-compose.dev.yml down -v
```

## 🔧 Configuration

### Environment Variables

The project uses different environment files for different purposes:

#### Docker Development (.env.dev)
Used by `docker-compose.dev.yml`:
```env
# MongoDB Configuration
MONGO_INITDB_ROOT_USERNAME=epitrello
MONGO_INITDB_ROOT_PASSWORD=epitrello_dev_password
MONGO_INITDB_DATABASE=epitrello

# Backend Configuration
NODE_ENV=development
BACKEND_PORT=4000
MONGODB_URI=mongodb://epitrello:epitrello_dev_password@mongodb:27017/epitrello?authSource=admin
JWT_SECRET=dev_jwt_secret_change_in_production
CORS_ORIGIN=http://localhost:3000

# Frontend Configuration
FRONTEND_PORT=3000
NEXT_PUBLIC_GRAPHQL_API=http://localhost:4000/graphql
```

#### Docker Production (.env.prod)
Used by `docker-compose.prod.yml`:
```env
NODE_ENV=production
BACKEND_PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/epitrello
JWT_SECRET=your_very_secure_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com
FRONTEND_PORT=3000
NEXT_PUBLIC_GRAPHQL_API=https://your-backend-domain.com/graphql
```

#### Local Backend Development (backend/.env)
For running backend without Docker:
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://epitrello:epitrello_dev_password@localhost:27017/epitrello?authSource=admin
JWT_SECRET=dev_jwt_secret_change_in_production
CORS_ORIGIN=http://localhost:3000
```

#### Local Frontend Development (frontend/.env.local)
For running frontend without Docker:
```env
NEXT_PUBLIC_GRAPHQL_API=http://localhost:4000/graphql
```

**Note:** Never commit `.env`, `.env.dev`, `.env.prod`, or `.env.local` files to version control. Only the `.example` files should be committed.

## 🚢 Deployment

### Cloud Prerequisites

1. **Create a Google Cloud project**
2. **Enable Cloud Run API**
3. **Configure MongoDB Atlas**

### Manual Deployment

#### Backend
```bash
cd backend
gcloud run deploy epitrello-backend \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated
```

#### Frontend
```bash
cd frontend
gcloud run deploy epitrello-frontend \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated
```

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## 📝 Available Scripts

### Backend
- `npm run dev` - Start in development mode
- `npm start` - Start in production mode
- `npm test` - Run tests
- `npm run lint` - Lint code

### Frontend
- `npm run dev` - Start in development mode
- `npm run build` - Production build
- `npm start` - Start in production mode
- `npm test` - Run tests
- `npm run lint` - Lint code

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- React
- TypeScript
- Apollo Client
- TailwindCSS

### Backend
- Node.js
- Apollo Server
- GraphQL
- MongoDB
- JWT

### Infrastructure
- Docker
- Google Cloud Run
- MongoDB Atlas

## 📚 Documentation

Check the `docs/` folder for more detailed documentation.

## 🤝 Contributing

1. Fork the project
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Let's get to work! 🚀
