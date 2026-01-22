#!/bin/sh
set -e

DB_NAME="${POSTGRES_DB:-postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASS="${POSTGRES_PASSWORD:-postgres}"
DATA_DIR="/var/lib/pgadmin"

mkdir -p "${DATA_DIR}"

cat > "${DATA_DIR}/servers.json" <<EOF
{
  "Servers": {
    "1": {
      "Name": "EpiTrello Postgres",
      "Group": "Servers",
      "Host": "postgres",
      "Port": 5432,
      "MaintenanceDB": "${DB_NAME}",
      "Username": "${DB_USER}",
      "SSLMode": "prefer",
      "PassFile": "${DATA_DIR}/pgpass"
    }
  }
}
EOF

cat > "${DATA_DIR}/pgpass" <<EOF
postgres:5432:${DB_NAME}:${DB_USER}:${DB_PASS}
EOF

chmod 600 "${DATA_DIR}/pgpass"

exec /entrypoint.sh

