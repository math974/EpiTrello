variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "database_id" {
  description = "Firestore database ID (e.g. default, epitrello)"
  type        = string
  default     = "default"
}

variable "location_id" {
  description = "Region for Firestore (e.g. europe-west1)"
  type        = string
}

variable "type" {
  description = "Firestore database type. Use FIRESTORE_COMPATIBILITY for MongoDB compatibility (Firestore Enterprise)."
  type        = string
  default     = "FIRESTORE_COMPATIBILITY"
}

variable "delete_protection_state" {
  description = "Delete protection state for the database"
  type        = string
  default     = "DELETE_PROTECTION_DISABLED"
}

