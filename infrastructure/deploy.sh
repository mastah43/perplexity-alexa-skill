#!/bin/bash

# Deploy script for Perplexity Alexa Skill CDK infrastructure

set -e

echo "🚀 Starting CDK deployment for Perplexity Alexa Skill"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if CDK is bootstrapped
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${CDK_DEFAULT_REGION:-eu-central-1}

echo "📋 Account ID: $ACCOUNT_ID"
echo "🌍 Region: $REGION"

# Bootstrap CDK if needed
echo "🔧 Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION > /dev/null 2>&1; then
    echo "⚙️  Bootstrapping CDK for account $ACCOUNT_ID in region $REGION..."
    npx cdk bootstrap aws://$ACCOUNT_ID/$REGION
else
    echo "✅ CDK already bootstrapped"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
cd ../lambda && npm install && cd ../infrastructure

# Deploy the stack
echo "🚀 Deploying CDK stack..."
npx cdk deploy --require-approval never

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update the Perplexity API key in AWS Secrets Manager"
echo "2. Copy the Lambda function ARN to your Alexa skill configuration"
echo "3. Test your Alexa skill"