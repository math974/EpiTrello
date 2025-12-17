terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }

  # Remote state backend (GCS).
  # Bucket and prefix are provided by the deploy scripts using -backend-config
  # for each environment/workspace (see configs/bootstrap-wif-dev.config and configs/bootstrap-wif-prd.config).
  backend "gcs" {}
}

data "google_project" "project" {
  project_id = var.project_id
}

resource "random_id" "pool_suffix" {
  byte_length = 4
}

resource "google_iam_workload_identity_pool" "pool" {
  project                   = var.project_id
  workload_identity_pool_id = "${var.pool_id}-${var.environment}-${random_id.pool_suffix.hex}"
  display_name              = "GitHub Pool ${upper(var.environment)}"
  description               = "WIF pool for GitHub Actions - ${var.environment}"
}

resource "google_iam_workload_identity_pool_provider" "provider" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "${var.provider_id}-${var.environment}"
  display_name                       = "GitHub OIDC ${upper(var.environment)}"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  # Condition basée sur l'environnement et les branches autorisées
  attribute_condition = "attribute.repository == '${var.github_owner}/${var.github_repo}'"
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account" "sa" {
  project      = var.project_id
  account_id   = "${var.service_account_id}-${var.environment}"
  display_name = "${var.service_account_display_name} ${upper(var.environment)}"
}

resource "google_project_iam_member" "sa_roles" {
  for_each = toset(var.roles)
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${google_service_account.sa.email}"
}

resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.pool.name}/attribute.repository/${var.github_owner}/${var.github_repo}"
}

# Rôles de facturation (doivent être assignés au niveau du compte de facturation, pas du projet)
resource "google_billing_account_iam_member" "sa_billing_admin" {
  count              = var.billing_account_id != "" ? 1 : 0
  billing_account_id = var.billing_account_id
  role               = "roles/billing.admin"
  member             = "serviceAccount:${google_service_account.sa.email}"
}