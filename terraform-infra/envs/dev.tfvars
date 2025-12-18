project_id       = "epitrello-480914"
region           = "europe-west1"
artifact_repo_id = "epitrello-docker"

backend_image_tag  = "dev"
frontend_image_tag = "dev"

labels = {
  environment = "dev"
  app         = "epitrello"
}

# Plain env vars (non-secret)
plain_env_backend = {
  NODE_ENV = "production"
}

plain_env_frontend = {
  NEXT_PUBLIC_GRAPHQL_API = "https://backend-dev.example.com/graphql"
}

# Secrets to create (secret_id => value)
env_secrets = {
  MONGODB_URI = "mongodb+srv://user:password@cluster-dev.mongodb.net/epitrello?retryWrites=true&w=majority"
  JWT_SECRET  = "change-me-dev"
}

# Mapping env var -> secret id
secret_env_backend = {
  MONGODB_URI = "MONGODB_URI"
  JWT_SECRET  = "JWT_SECRET"
}

secret_env_frontend = {
  BACKEND_URL = "MONGODB_URI" # example placeholder; adjust/remove as needed
}