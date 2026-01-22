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

variable "node_env" {
  description = "NODE_ENV value for Cloud Run services"
  type        = string
  default     = "production"
}

variable "backend_port" {
  description = "Backend port for Cloud Run"
  type        = number
  default     = 4000
}

variable "frontend_port" {
  description = "Frontend port for Cloud Run"
  type        = number
  default     = 3000
}

variable "cors_origin" {
  description = "CORS origin allowed by backend"
  type        = string
}

variable "jwt_secret" {
  description = "JWT secret for backend (stored in Secret Manager)"
  type        = string
  sensitive   = true
}

variable "postgres_instance_name" {
  description = "Cloud SQL Postgres instance name"
  type        = string
  default     = "epitrello-postgres"
}

variable "postgres_version" {
  description = "Cloud SQL Postgres version"
  type        = string
  default     = "POSTGRES_15"
}

variable "postgres_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "postgres_disk_size_gb" {
  description = "Cloud SQL disk size (GB)"
  type        = number
  default     = 20
}

variable "postgres_availability_type" {
  description = "Cloud SQL availability type (ZONAL or REGIONAL)"
  type        = string
  default     = "ZONAL"
}

variable "postgres_db_name" {
  description = "Default database name"
  type        = string
  default     = "epitrello"
}

variable "postgres_user" {
  description = "Database user"
  type        = string
  default     = "epitrello"
}

variable "postgres_password" {
  description = "Database user password"
  type        = string
  sensitive   = true
  default     = null
}
