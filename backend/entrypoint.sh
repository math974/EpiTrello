#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Starting app..."
node dist/main.js








