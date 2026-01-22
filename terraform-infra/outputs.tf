output "postgres_instance_name" {
  description = "Cloud SQL Postgres instance name"
  value       = google_sql_database_instance.postgres.name
}

output "postgres_connection_name" {
  description = "Cloud SQL Postgres connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "postgres_database" {
  description = "Cloud SQL database name"
  value       = google_sql_database.app.name
}

output "postgres_user" {
  description = "Cloud SQL database user"
  value       = google_sql_user.app.name
}
