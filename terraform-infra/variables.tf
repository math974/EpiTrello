variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region (e.g. europe-west1)"
  type        = string
}

variable "labels" {
  description = "Labels to apply on resources"
  type        = map(string)
  default     = {}
}

variable "artifact_repo_id" {
  description = "Artifact Registry repository ID (Docker)"
  type        = string
  default     = "epitrello-docker"
}

variable "backend_image_tag" {
  description = "Tag for backend image (already pushed to Artifact Registry)"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Tag for frontend image (already pushed to Artifact Registry)"
  type        = string
  default     = "latest"
}

variable "env_secrets" {
  description = "Map of secret_id => value for Secret Manager"
  type        = map(string)
  default     = {}
}

variable "plain_env_backend" {
  description = "Plain (non-secret) env vars for backend container"
  type        = map(string)
  default     = {}
}

variable "plain_env_frontend" {
  description = "Plain (non-secret) env vars for frontend container"
  type        = map(string)
  default     = {}
}

variable "secret_env_backend" {
  description = "Env vars for backend referencing Secret Manager ids (map: ENV_NAME => secret_id)"
  type        = map(string)
  default     = {}
}

variable "secret_env_frontend" {
  description = "Env vars for frontend referencing Secret Manager ids (map: ENV_NAME => secret_id)"
  type        = map(string)
  default     = {}
}
