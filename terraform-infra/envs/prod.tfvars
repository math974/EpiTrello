project_id       = "epitrello-prod"
region           = "europe-west1"
artifact_repo_id = "epitrello-docker"

backend_image_tag  = "prod"
frontend_image_tag = "prod"

labels = {
  environment = "prod"
  app         = "epitrello"
}

# Plain env vars (non-secret)
plain_env_backend = {
  NODE_ENV = "production"
}

plain_env_frontend = {
}

# Secrets to create (secret_id => value)
env_secrets = {
  MONGODB_URI = "mongodb+srv://user:password@cluster-prod.mongodb.net/epitrello?retryWrites=true&w=majority"
  JWT_SECRET  = "change-me-prod"
  BACKEND_URL = "https://placeholder-backend-url"
}

# Mapping env var -> secret id
secret_env_backend = {
  MONGODB_URI = "MONGODB_URI"
  JWT_SECRET  = "JWT_SECRET"
}

secret_env_frontend = {
  NEXT_PUBLIC_GRAPHQL_API = "BACKEND_URL"
}