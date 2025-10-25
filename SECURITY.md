# Security Guide

This document outlines security best practices for the Perplexity Alexa Skill project.

## API Key Management

### ⚠️ NEVER commit API keys to git

The project includes multiple layers of protection:

- **`.gitignore`** - Excludes `.env` files and sensitive configuration
- **Environment variables** - API keys stored in `.env` files locally
- **AWS Secrets Manager** - Encrypted storage for production

### Local Development

**Quick Setup:**
```bash
npm run setup
```

This interactive script will:
- Prompt for your Perplexity API key
- Validate the key format
- Test the API connection
- Create a secure `.env` file
- Exclude the file from git automatically

**Manual Setup:**
```bash
cp .env.example .env
# Edit .env with your API key
```

### Production Deployment

**AWS Secrets Manager Setup:**
```bash
npm run setup:aws
```

This script will:
- Check AWS CLI configuration
- Prompt for your API key securely (hidden input)
- Create/update the secret in AWS Secrets Manager
- Provide the secret ARN for CDK deployment

**Manual AWS Setup:**
```bash
aws secretsmanager create-secret \
  --name perplexity-alexa-skill/api-key \
  --description "Perplexity AI API key for Alexa skill" \
  --secret-string '{"apiKey":"your-api-key-here"}'
```

## File Security

### Protected Files (in .gitignore)

- `.env` - Local environment variables
- `config.json` - Any configuration files
- `secrets.json` - Secret configuration
- `*.key`, `*.pem` - Private keys and certificates
- `.aws-config/` - AWS configuration directories

### Safe to Commit

- `.env.example` - Template without real values
- All source code files
- Configuration templates
- Documentation

## Environment Variables

### Development (.env file)
```bash
PERPLEXITY_API_KEY=your-api-key-here
PORT=3000
NODE_ENV=development
```

### Production (AWS Secrets Manager)
The Lambda function automatically retrieves the API key from:
- **Secret Name**: `perplexity-alexa-skill/api-key`
- **Secret Format**: `{"apiKey":"your-key"}`

## Access Control

### AWS IAM Permissions

The CDK stack creates minimal IAM permissions:

**Lambda Execution Role:**
- Basic Lambda execution permissions
- Read access to specific Secrets Manager secret
- CloudWatch Logs write permissions

**Alexa Skill Permissions:**
- Only allows Alexa service principal to invoke Lambda
- Restricted to specific skill ID (when provided)

### Local Development

- API keys stored in local `.env` files
- No cloud access required for basic testing
- Mock responses available for testing without API keys

## Best Practices

### 1. API Key Rotation
```bash
# Update local environment
npm run setup

# Update AWS secret
npm run setup:aws

# Redeploy if needed
npm run cdk:deploy
```

### 2. Testing Security
```bash
# Test with mock responses (no API key needed)
npm test

# Test with real API (requires API key)
npm run dev:test
```

### 3. Monitoring
- CloudWatch logs capture errors (but not secrets)
- AWS CloudTrail monitors Secrets Manager access
- Lambda execution logs for debugging

### 4. Secret Validation
The setup scripts include:
- Format validation for API keys
- Connection testing to verify keys work
- Secure input (hidden passwords in terminal)

## Emergency Procedures

### Compromised API Key
1. **Revoke the key** at https://www.perplexity.ai/settings/api
2. **Generate a new key**
3. **Update locally**: `npm run setup`
4. **Update AWS**: `npm run setup:aws`
5. **Redeploy**: `npm run cdk:deploy`

### Accidental Commit
1. **Revoke the exposed key immediately**
2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push**: `git push origin --force --all`
4. **Generate new key and follow setup process**

## Compliance Notes

- API keys are never logged or exposed in error messages
- AWS Secrets Manager provides encryption at rest and in transit
- Local `.env` files should be secured with appropriate file permissions
- The Lambda function only accesses the specific secret it needs