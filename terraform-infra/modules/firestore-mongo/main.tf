resource "google_firestore_database" "this" {
  project                  = var.project_id
  database_id              = var.database_id
  location_id              = var.location_id
  type                     = var.type
  delete_protection_state  = var.delete_protection_state
}

