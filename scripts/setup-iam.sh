#!/bin/bash

# Script to set up IAM user and permissions for CDK deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

USER_NAME="perplexity-alexa-deployer"
POLICY_NAME="PerplexityAlexaDeployPolicy"

echo -e "${CYAN}🔐 AWS IAM Setup for CDK Deployment${NC}"
echo -e "${CYAN}====================================${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}📋 AWS Account: ${ACCOUNT_ID}${NC}"

# Ask user which option they prefer
echo -e "\n${CYAN}Choose IAM permission setup:${NC}"
echo -e "1. ${GREEN}Managed Policies${NC} (PowerUserAccess + IAMFullAccess) - Recommended"
echo -e "2. ${YELLOW}Custom Policy${NC} (Minimal permissions) - Most secure"
echo -e "3. ${RED}Administrator Access${NC} (Full permissions) - Development only"

while true; do
    read -p "Enter your choice (1-3): " choice
    case $choice in
        1|2|3) break;;
        *) echo -e "${RED}Please enter 1, 2, or 3${NC}";;
    esac
done

# Check if user already exists
if aws iam get-user --user-name "$USER_NAME" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  User $USER_NAME already exists${NC}"
    read -p "Delete and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}🗑️  Deleting existing user...${NC}"
        
        # Delete access keys
        aws iam list-access-keys --user-name "$USER_NAME" --query 'AccessKeyMetadata[].AccessKeyId' --output text | \
        while read -r key_id; do
            if [[ -n "$key_id" ]]; then
                aws iam delete-access-key --user-name "$USER_NAME" --access-key-id "$key_id"
            fi
        done
        
        # Detach policies
        aws iam list-attached-user-policies --user-name "$USER_NAME" --query 'AttachedPolicies[].PolicyArn' --output text | \
        while read -r policy_arn; do
            if [[ -n "$policy_arn" ]]; then
                aws iam detach-user-policy --user-name "$USER_NAME" --policy-arn "$policy_arn"
            fi
        done
        
        # Delete user
        aws iam delete-user --user-name "$USER_NAME"
        echo -e "${GREEN}✅ Existing user deleted${NC}"
    else
        echo -e "${YELLOW}Setup cancelled${NC}"
        exit 0
    fi
fi

# Create user
echo -e "${CYAN}👤 Creating IAM user: $USER_NAME${NC}"
aws iam create-user --user-name "$USER_NAME"

# Attach policies based on choice
case $choice in
    1)
        echo -e "${CYAN}📋 Attaching managed policies...${NC}"
        aws iam attach-user-policy --user-name "$USER_NAME" \
            --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
        aws iam attach-user-policy --user-name "$USER_NAME" \
            --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
        echo -e "${GREEN}✅ Managed policies attached${NC}"
        ;;
    2)
        echo -e "${CYAN}📋 Creating custom policy...${NC}"
        
        # Check if policy already exists and delete if it does
        if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Policy already exists, deleting...${NC}"
            aws iam delete-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
        fi
        
        # Create policy
        POLICY_ARN=$(aws iam create-policy --policy-name "$POLICY_NAME" \
            --policy-document file://aws-iam-policy.json \
            --query 'Policy.Arn' --output text)
        
        # Attach policy
        aws iam attach-user-policy --user-name "$USER_NAME" --policy-arn "$POLICY_ARN"
        echo -e "${GREEN}✅ Custom policy created and attached${NC}"
        ;;
    3)
        echo -e "${CYAN}📋 Attaching administrator access...${NC}"
        aws iam attach-user-policy --user-name "$USER_NAME" \
            --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
        echo -e "${RED}⚠️  Administrator access granted - use only for development!${NC}"
        ;;
esac

# Create access keys
echo -e "${CYAN}🔑 Creating access keys...${NC}"
ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name "$USER_NAME")
ACCESS_KEY_ID=$(echo "$ACCESS_KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
SECRET_ACCESS_KEY=$(echo "$ACCESS_KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')

echo -e "${GREEN}✅ IAM setup completed!${NC}"
echo -e "\n${CYAN}📋 Credentials:${NC}"
echo -e "${BLUE}Access Key ID: ${ACCESS_KEY_ID}${NC}"
echo -e "${BLUE}Secret Access Key: ${SECRET_ACCESS_KEY}${NC}"

echo -e "\n${CYAN}🚀 Next Steps:${NC}"
echo -e "1. Configure AWS CLI with these credentials:"
echo -e "   ${BLUE}aws configure${NC}"
echo -e "   - Use the Access Key ID and Secret Key above"
echo -e "   - Choose your preferred region (e.g., us-east-1)"
echo -e ""
echo -e "2. Test permissions:"
echo -e "   ${BLUE}aws cloudformation list-stacks${NC}"
echo -e ""
echo -e "3. Deploy the project:"
echo -e "   ${BLUE}npm run setup:aws${NC}  # Configure API key"
echo -e "   ${BLUE}npm run cdk:deploy${NC} # Deploy infrastructure"

echo -e "\n${YELLOW}⚠️  Security Note:${NC}"
echo -e "- Store these credentials securely"
echo -e "- Don't share or commit them to git"
echo -e "- Consider using AWS CLI profiles for multiple projects"

echo -e "\n${GREEN}✅ Setup complete!${NC}"