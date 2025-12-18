terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0, < 8.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.0, < 8.0"
    }
  }

  backend "gcs" {}
}

data "google_project" "project" {
  project_id = var.project_id
}

# -----------------------------------------------------------------------------
# IAM: dedicated service accounts
# -----------------------------------------------------------------------------

resource "google_service_account" "backend" {
  account_id   = "epitrello-backend"
  display_name = "EpiTrello Backend"
  project      = var.project_id
}

resource "google_service_account" "frontend" {
  account_id   = "epitrello-frontend"
  display_name = "EpiTrello Frontend"
  project      = var.project_id
}

resource "google_project_iam_member" "backend_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "frontend_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}

resource "google_project_iam_member" "artifact_registry_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "artifact_registry_reader_frontend" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.frontend.email}"
}

# -----------------------------------------------------------------------------
# Artifact Registry (Docker)
# -----------------------------------------------------------------------------

resource "google_artifact_registry_repository" "docker_repo" {
  provider      = google-beta
  project       = var.project_id
  location      = var.region
  repository_id = var.artifact_repo_id
  description   = "Docker images for EpiTrello backend/frontend"
  format        = "DOCKER"
  labels        = var.labels
}

# -----------------------------------------------------------------------------
# Secrets (env vars)
# -----------------------------------------------------------------------------

resource "google_secret_manager_secret" "env" {
  for_each = var.env_secrets

  project   = var.project_id
  secret_id = each.key

  replication {
    auto {}
  }
  labels = var.labels
}

resource "google_secret_manager_secret_version" "env_value" {
  for_each = var.env_secrets

  secret      = google_secret_manager_secret.env[each.key].id
  secret_data = each.value
}

resource "google_secret_manager_secret_iam_member" "backend_secret_access" {
  for_each = google_secret_manager_secret.env

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_secret_manager_secret_iam_member" "frontend_secret_access" {
  for_each = google_secret_manager_secret.env

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.frontend.email}"
}

# -----------------------------------------------------------------------------
# Cloud Run (backend)
# -----------------------------------------------------------------------------

module "cloud_run_backend" {
  source = "./modules/cloud-run"

  project_id            = var.project_id
  region                = var.region
  service_name          = "epitrello-backend"
  image                 = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/backend:${var.backend_image_tag}"
  service_account_email = google_service_account.backend.email
  labels                = var.labels
  public                = true

  plain_env  = var.plain_env_backend
  secret_env = { for k, v in var.secret_env_backend : k => google_secret_manager_secret.env[v].secret_id }
}

module "cloud_run_frontend" {
  source = "./modules/cloud-run"

  project_id            = var.project_id
  region                = var.region
  service_name          = "epitrello-frontend"
  image                 = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/frontend:${var.frontend_image_tag}"
  service_account_email = google_service_account.frontend.email
  labels                = var.labels
  public                = true

  plain_env  = var.plain_env_frontend
  secret_env = { for k, v in var.secret_env_frontend : k => google_secret_manager_secret.env[v].secret_id }
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "backend_url" {
  value       = module.cloud_run_backend.url
  description = "Public URL for the backend Cloud Run service"
}

output "frontend_url" {
  value       = module.cloud_run_frontend.url
  description = "Public URL for the frontend Cloud Run service"
}

output "artifact_repo" {
  value       = google_artifact_registry_repository.docker_repo.repository_id
  description = "Artifact Registry repository ID for Docker images"
}