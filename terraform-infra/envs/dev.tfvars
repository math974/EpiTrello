project_id       = "epitrello-480914"
region           = "europe-west1"
artifact_repo_id = "epitrello-docker"

backend_image_tag  = "dev"
frontend_image_tag = "dev"

labels = {
  environment = "dev"
  app         = "epitrello"
}

plain_env_backend   = {}
plain_env_frontend  = {}

node_env     = "production"
backend_port = 4000
frontend_port = 3000
cors_origin  = "http://localhost:3000"
jwt_secret   = "change-me-dev"

plain_env_backend  = {}
plain_env_frontend = {}
env_secrets        = {}
secret_env_backend = {}
secret_env_frontend = {}