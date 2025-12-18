variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
}

variable "image" {
  description = "Container image (Artifact Registry URL)"
  type        = string
}

variable "service_account_email" {
  description = "Service account email to run the service"
  type        = string
}

variable "labels" {
  description = "Labels to set on the service"
  type        = map(string)
  default     = {}
}

variable "plain_env" {
  description = "Plain environment variables map"
  type        = map(string)
  default     = {}
}

variable "secret_env" {
  description = "Secret-based environment variables map (ENV_NAME => secret_id)"
  type        = map(string)
  default     = {}
}

variable "public" {
  description = "Whether to allow public invocation (allUsers)"
  type        = bool
  default     = true
}

