#!/bin/bash

echo "🚀 Starting deployment process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed the database (only if needed)
echo "🌱 Seeding database..."
npm run prisma:seed

echo "✅ Deployment completed successfully!" 