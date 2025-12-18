output "url" {
  value       = google_cloud_run_service.this.status[0].url
  description = "Public URL of the Cloud Run service"
}

