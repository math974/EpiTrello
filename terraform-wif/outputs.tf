output "workload_identity_provider_name" {
  description = "Nom complet du Workload Identity Provider"
  value       = google_iam_workload_identity_pool_provider.provider.name
}

output "service_account_email" {
  description = "Email du service account Terraform"
  value       = google_service_account.sa.email
}