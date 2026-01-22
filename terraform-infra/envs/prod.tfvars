project_id       = "epitrello-prod"
region           = "europe-west1"
artifact_repo_id = "epitrello-docker"

backend_image_tag  = "prod"
frontend_image_tag = "prod"

labels = {
  environment = "prod"
  app         = "epitrello"
}

plain_env_backend   = {}
plain_env_frontend  = {}

node_env      = "production"
backend_port  = 4000
frontend_port = 3000
cors_origin   = "https://your-frontend-domain.com"
jwt_secret    = "change-me-prod"

plain_env_backend   = {}
plain_env_frontend  = {}
env_secrets         = {}
secret_env_backend  = {}
secret_env_frontend = {}