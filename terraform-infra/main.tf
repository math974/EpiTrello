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
    random = {
      source  = "hashicorp/random"
      version = ">= 3.5.0, < 4.0.0"
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

resource "google_project_iam_member" "backend_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
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
# Secrets + generated values (Cloud SQL)
# -----------------------------------------------------------------------------

resource "random_password" "postgres" {
  length  = 24
  special = true
}

locals {
  postgres_password_value = (
    var.postgres_password != null && var.postgres_password != ""
    ? var.postgres_password
    : random_password.postgres.result
  )
}

# -----------------------------------------------------------------------------
# Cloud SQL (Postgres) - protected from deletion
# -----------------------------------------------------------------------------

resource "google_sql_database_instance" "postgres" {
  name             = var.postgres_instance_name
  project          = var.project_id
  region           = var.region
  database_version = var.postgres_version
  deletion_protection = true

  settings {
    tier              = var.postgres_tier
    disk_size         = var.postgres_disk_size_gb
    disk_autoresize   = true
    disk_autoresize_limit = 0
    availability_type = var.postgres_availability_type
    user_labels       = var.labels

    ip_configuration {
      ipv4_enabled = true
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_sql_database" "app" {
  name     = var.postgres_db_name
  project  = var.project_id
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "app" {
  name     = var.postgres_user
  project  = var.project_id
  instance = google_sql_database_instance.postgres.name
  password = local.postgres_password_value
}

# Build the Cloud SQL socket connection string for Cloud Run
locals {
  database_url = "postgresql://${var.postgres_user}:${local.postgres_password_value}@/${var.postgres_db_name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}"
}

# -----------------------------------------------------------------------------
# Secrets (env vars)
# -----------------------------------------------------------------------------

locals {
  env_secrets_all = merge(
    var.env_secrets,
    {
      JWT_SECRET       = var.jwt_secret
      DATABASE_URL     = local.database_url
      POSTGRES_PASSWORD = local.postgres_password_value
    }
  )
}

# -----------------------------------------------------------------------------
# Secrets (env vars)
# -----------------------------------------------------------------------------

resource "google_secret_manager_secret" "env" {
  for_each = local.env_secrets_all

  project   = var.project_id
  secret_id = each.key

  replication {
    auto {}
  }
  labels = var.labels
}

resource "google_secret_manager_secret" "backend_url" {
  project   = var.project_id
  secret_id = "BACKEND_URL"

  replication {
    auto {}
  }
  labels = var.labels
}

resource "google_secret_manager_secret_version" "backend_url_version" {
  secret      = google_secret_manager_secret.backend_url.id
  secret_data = module.cloud_run_backend.url

  depends_on = [module.cloud_run_backend]
}

resource "google_secret_manager_secret_iam_member" "backend_url_access_frontend" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.backend_url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.frontend.email}"
}

locals {
  env_secret_ids = merge(
    { for k, v in google_secret_manager_secret.env : k => v.secret_id },
    { BACKEND_URL = google_secret_manager_secret.backend_url.secret_id }
  )
}

resource "google_secret_manager_secret_version" "env_value" {
  for_each = local.env_secrets_all

  secret      = google_secret_manager_secret.env[each.key].id
  secret_data = each.value
}

resource "google_secret_manager_secret_iam_member" "backend_secret_access" {
  for_each = {
    for k, v in google_secret_manager_secret.env :
    k => v if contains(keys(local.secret_env_backend_all), k)
  }

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_secret_manager_secret_iam_member" "frontend_secret_access" {
  for_each = {
    for k, v in google_secret_manager_secret.env :
    k => v if contains(keys(local.secret_env_frontend_all), k)
  }

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.frontend.email}"
}

# -----------------------------------------------------------------------------
# Cloud Run (backend)
# -----------------------------------------------------------------------------

locals {
  plain_env_backend_all = merge(
    {
      NODE_ENV               = var.node_env
      PORT                   = tostring(var.backend_port)
      CORS_ORIGIN            = var.cors_origin
      CLOUDSQL_INSTANCES     = google_sql_database_instance.postgres.connection_name
    },
    var.plain_env_backend
  )

  plain_env_frontend_all = merge(
    {
      NODE_ENV = var.node_env
    },
    var.plain_env_frontend
  )

  secret_env_backend_all = merge(
    {
      DATABASE_URL = "DATABASE_URL"
      JWT_SECRET   = "JWT_SECRET"
    },
    var.secret_env_backend
  )

  secret_env_frontend_all = merge(
    {
      NEXT_PUBLIC_GRAPHQL_API = "BACKEND_URL"
    },
    var.secret_env_frontend
  )
}

module "cloud_run_backend" {
  source = "./modules/cloud-run"

  project_id            = var.project_id
  region                = var.region
  service_name          = "epitrello-backend"
  image                 = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker_repo.repository_id}/backend:${var.backend_image_tag}"
  service_account_email = google_service_account.backend.email
  labels                = var.labels
  public                = true

  plain_env  = local.plain_env_backend_all
  secret_env = { for k, v in local.secret_env_backend_all : k => google_secret_manager_secret.env[v].secret_id }
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

  plain_env  = local.plain_env_frontend_all
  secret_env = { for k, v in local.secret_env_frontend_all : k => local.env_secret_ids[v] }
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