#!/bin/bash

# Deploy Alexa skill using ASK CLI

set -e

echo "🚀 Deploying Alexa Skill with ASK CLI"

# Check if ASK CLI is configured
if ! ask util get-metrics &> /dev/null; then
    echo "❌ ASK CLI not configured. Run 'ask configure' first."
    exit 1
fi

# Check if Lambda function is deployed
if [[ -z "$LAMBDA_FUNCTION_ARN" ]]; then
    echo "❌ LAMBDA_FUNCTION_ARN environment variable not set"
    echo "   Get this from CDK deployment output"
    exit 1
fi

# Update skill.json with Lambda ARN
echo "📝 Updating skill.json with Lambda ARN..."
TEMP_SKILL_JSON=$(mktemp)
jq --arg arn "$LAMBDA_FUNCTION_ARN" '.maxynifest.apis.custom.endpoint.uri = $arn' skill-package/skill.json > "$TEMP_SKILL_JSON"
mv "$TEMP_SKILL_JSON" skill-package/skill.json

# Deploy the skill
echo "🚀 Deploying skill..."
ask deploy

# Get skill ID from deployment
SKILL_ID=$(ask util get-skill-id)
echo "✅ Skill deployed successfully!"
echo "📋 Skill ID: $SKILL_ID"

# Update Lambda permissions if needed
echo "🔐 Updating Lambda permissions..."
aws lambda add-permission \
    --function-name perplexity-alexa-skill \
    --statement-id alexa-skill-trigger \
    --action lambda:InvokeFunction \
    --principal alexa-appkit.amazon.com \
    --event-source-token "$SKILL_ID" \
    --region "${AWS_DEFAULT_REGION:-eu-central-1}" \
    || echo "Permission already exists or failed to add"

echo "🎉 Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Test in Alexa Developer Console"
echo "2. Enable skill for testing on your devices"
echo "3. Try: 'Alexa, open perplexity search'"