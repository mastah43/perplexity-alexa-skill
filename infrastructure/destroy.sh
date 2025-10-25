#!/bin/bash

# Destroy script for Perplexity Alexa Skill CDK infrastructure

set -e

echo "🗑️  Starting CDK destroy for Perplexity Alexa Skill"

# Confirmation prompt
read -p "Are you sure you want to destroy the infrastructure? This action cannot be undone. (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Destroy cancelled."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Destroy the stack
echo "🗑️  Destroying CDK stack..."
npx cdk destroy --force

echo "✅ Infrastructure destroyed!"
echo ""
echo "⚠️  Note: AWS Secrets Manager secrets have a recovery period."
echo "   You may need to manually delete them from the AWS console if needed."