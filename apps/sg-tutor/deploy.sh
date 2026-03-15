#!/bin/bash
set -e

echo "Setting Google Cloud Project..."
gcloud config set project legal-ai-engine

echo "Enabling required Google Cloud APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# Purpose: Cloud Build needs the full monorepo as its build context so
# npm workspaces can resolve packages/* dependencies. We copy our
# Dockerfile and .dockerignore to the monorepo root temporarily.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Preparing monorepo build context..."
cp "$SCRIPT_DIR/Dockerfile" "$MONO_ROOT/Dockerfile"
cp "$SCRIPT_DIR/.dockerignore" "$MONO_ROOT/.dockerignore"

echo "Deploying to Cloud Run from monorepo root..."
gcloud run deploy sg-tutor-live \
    --source "$MONO_ROOT" \
    --region asia-southeast1 \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "GEMINI_API_KEY=YOUR_API_KEY_HERE,GOOGLE_GENERATIVE_AI_API_KEY=YOUR_API_KEY_HERE"

# Purpose: Clean up temporary root-level build files.
echo "Cleaning up temporary build files..."
rm -f "$MONO_ROOT/Dockerfile" "$MONO_ROOT/.dockerignore"

echo "Deployment submitted!"
