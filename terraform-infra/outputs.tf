output "function_urls" {
  description = "URLs publiques par fonction"
  value       = { for name, mod in module.functions : name => mod.function_url }
}

output "firestore_database" {
  description = "Informations sur la database Firestore"
  value = {
    id          = module.firestore.database_id
    name        = module.firestore.database_name
    location    = module.firestore.database_location
    type        = module.firestore.database_type
    secret_id   = module.firestore.secret_id
    secret_name = module.firestore.secret_name
  }
}

output "pubsub_topics" {
  description = "Pub/Sub topics créés"
  value       = module.pubsub.topic_names
}

output "pubsub_subscriptions" {
  description = "Pub/Sub subscriptions créées"
  value       = module.pubsub.subscription_names
}
