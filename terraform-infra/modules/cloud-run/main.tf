locals {
  cloudsql_instances = lookup(var.plain_env, "CLOUDSQL_INSTANCES", "")
}

resource "google_cloud_run_service" "this" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  template {
    spec {
      service_account_name = var.service_account_email

      containers {
        image = var.image

        dynamic "env" {
          for_each = var.plain_env
          content {
            name  = env.key
            value = env.value
          }
        }

        dynamic "env" {
          for_each = var.secret_env
          content {
            name = env.key
            value_from {
              secret_key_ref {
                name = env.value
                key  = "latest"
              }
            }
          }
        }
      }
    }

    metadata {
      annotations = merge(
        {
        "run.googleapis.com/client-name" = "terraform"
        },
        local.cloudsql_instances != ""
        ? { "run.googleapis.com/cloudsql-instances" = local.cloudsql_instances }
        : {}
      )
      labels = var.labels
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

resource "google_cloud_run_service_iam_member" "invoker" {
  count    = var.public ? 1 : 0
  location = google_cloud_run_service.this.location
  project  = var.project_id
  service  = google_cloud_run_service.this.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

