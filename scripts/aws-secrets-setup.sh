#!/bin/bash

# AWS Secrets Manager setup script for Perplexity API key

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SECRET_NAME="perplexity-alexa-skill/api-key"
REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo -e "${CYAN}🔐 AWS Secrets Manager Setup${NC}"
echo -e "${CYAN}=============================${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo -e "${BLUE}   Install: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Get current AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
CURRENT_REGION=$(aws configure get region)
REGION=${CURRENT_REGION:-$REGION}

echo -e "${BLUE}📋 AWS Account: ${ACCOUNT_ID}${NC}"
echo -e "${BLUE}🌍 Region: ${REGION}${NC}"

# Prompt for API key
echo -e "\n${CYAN}🔑 Perplexity AI API Key Setup${NC}"
echo -e "Get your API key from: ${BLUE}https://www.perplexity.ai/settings/api${NC}"

while true; do
    read -s -p "🔑 Enter your Perplexity API key: " API_KEY
    echo
    
    if [[ -z "$API_KEY" ]]; then
        echo -e "${RED}❌ API key cannot be empty. Please try again.${NC}"
        continue
    fi
    
    if [[ ${#API_KEY} -lt 20 ]]; then
        echo -e "${YELLOW}⚠️  Warning: API key seems short. Continue anyway? (y/N)${NC}"
        read -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            continue
        fi
    fi
    
    break
done

# Check if secret already exists
echo -e "\n${CYAN}🔍 Checking if secret exists...${NC}"

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Secret already exists: $SECRET_NAME${NC}"
    echo -e "${YELLOW}   This will update the existing secret.${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Operation cancelled.${NC}"
        exit 0
    fi
    
    # Update existing secret
    echo -e "${CYAN}🔄 Updating secret...${NC}"
    aws secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME" \
        --secret-string "{\"apiKey\":\"$API_KEY\"}" \
        --region "$REGION" > /dev/null
    
    echo -e "${GREEN}✅ Secret updated successfully!${NC}"
else
    # Create new secret
    echo -e "${CYAN}🆕 Creating new secret...${NC}"
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "Perplexity AI API key for Alexa skill" \
        --secret-string "{\"apiKey\":\"$API_KEY\"}" \
        --region "$REGION" > /dev/null
    
    echo -e "${GREEN}✅ Secret created successfully!${NC}"
fi

# Get secret ARN
SECRET_ARN=$(aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" --query ARN --output text)

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "${BLUE}📋 Secret Name: ${SECRET_NAME}${NC}"
echo -e "${BLUE}🔗 Secret ARN: ${SECRET_ARN}${NC}"

echo -e "\n${CYAN}🚀 Next Steps:${NC}"
echo -e "1. Deploy CDK stack: ${BLUE}npm run cdk:deploy${NC}"
echo -e "2. The Lambda function will automatically use this secret"
echo -e "3. Test your deployment: ${BLUE}npm run dev:test${NC}"

echo -e "\n${CYAN}💡 Testing the secret:${NC}"
echo -e "aws secretsmanager get-secret-value --secret-id \"$SECRET_NAME\" --region \"$REGION\""

echo -e "\n${CYAN}🗑️  To delete the secret later:${NC}"
echo -e "aws secretsmanager delete-secret --secret-id \"$SECRET_NAME\" --region \"$REGION\""

echo -e "\n${GREEN}✅ AWS Secrets Manager setup complete!${NC}"