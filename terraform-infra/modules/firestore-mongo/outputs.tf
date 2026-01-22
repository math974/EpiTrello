output "database_id" {
  description = "Firestore MongoDB-compatible database ID"
  value       = google_firestore_database.this.database_id
}

output "name" {
  description = "Full resource name of the Firestore database"
  value       = google_firestore_database.this.name
}

