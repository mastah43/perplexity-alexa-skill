# Perplexity Alexa Skill

An Alexa skill that forwards user queries to the Perplexity AI API and reads back intelligent responses.

## Features

- Natural language query handling
- Integration with Perplexity AI API
- Voice responses optimized for Alexa
- Error handling and fallback responses

## Prerequisites

- Node.js 14+
- AWS CLI configured with appropriate IAM permissions (see [AWS IAM Requirements](#aws-iam-requirements))
- ASK CLI installed (`npm install -g ask-cli`)
- Perplexity AI API key (get from [Perplexity AI Settings](https://www.perplexity.ai/settings/api))

### AWS IAM permissions

The AWS user/role running CDK deployment needs the following permissions:
Create a custom IAM policy with the permissions as defined in the [aws-iam-policy.json](aws-iam-policy.json).
The policy could be created with name 'alexa-perplexity-cdk' and assigned to AWS IAM user 'alexa-perplexity-cdk'.
See section "AWS IAM Requirements" below for detailed instructions on setting up IAM permissions.

## Security

⚠️ **Never commit API keys to git!** This project includes secure configuration management:

- **Local development**: Uses `.env` files (excluded from git)
- **Production**: Uses AWS Secrets Manager for encrypted storage
- **Setup scripts**: Interactive, secure API key configuration

See [SECURITY.md](SECURITY.md) for detailed security guidelines.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and edit it with your credentials:

```bash
cp .env.example .env
```

Then edit `.env` and set:

- **PERPLEXITY_API_KEY**: Your Perplexity AI API key from [Perplexity AI Settings](https://www.perplexity.ai/settings/api)
- **SKILL_ID**: Your Alexa Skill ID from the Alexa Developer Console (format: `amzn1.ask.skill.XXXXXXXX`)

#### Alternative: Interactive Setup for API Key

**For Local Development:**

```bash
npm run setup
```

**For Production (AWS Secrets Manager):**

```bash
npm run setup:aws
```

**Note:** The interactive setup scripts configure the API key but not the SKILL_ID. You must manually add SKILL_ID to your `.env` file.

### 3. Deploy Infrastructure

Bootstrap AWS CDK for the AWS account (if not already done)

```bash
cdk bootstrap aws://<your AWS account id>/<AWS region>
```

Deploy AWS infrastructure via AWS CDK

```bash
cd infrastructure
./deploy.sh
```

### 4. Deploy Alexa Skill Configuration (not the AWS infrastructure)

```bash
npm run deploy
```

## Usage

Once deployed, you can interact with the skill by saying:

- "Alexa, open perplexity search"
- "Alexa, ask perplexity search what is artificial intelligence"
- "Alexa, ask perplexity search to tell me about climate change"

## Configuration

- Update the Lambda function ARN in `skill-package/skill.json`
- Modify the invocation name in `skill-package/interactionModels/custom/en-US.json`
- Adjust response parameters in `lambda/index.js`

## Local Development

### Quick Start

```bash
# Install dependencies
npm install

# Secure API key setup (interactive)
npm run setup

# Start local development server
npm run dev:start

# Run tests against local server
npm run dev:test
```

### Testing Options

**Jest Unit/Integration Tests:**

```bash
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

**HTTP Testing:**

```bash
npm run dev:start      # Start local server
npm run dev:test       # Test HTTP endpoints
```

**SAM CLI Testing:**

```bash
npm run sam:start      # Start with API Gateway
npm run sam:invoke     # Direct function invocation
```

### Development Workflow

1. **Start local server:** `npm run dev:watch` (auto-reload)
2. **Edit Lambda code** in `lambda/index.js`
3. **Test changes** with `npm run dev:test`
4. **Run full test suite** with `npm test`
5. **Deploy when ready** with `npm run cdk:deploy`

## Production Deployment

1. **Set up AWS secrets**: `npm run setup:aws`
2. **Deploy infrastructure**: `npm run cdk:deploy`
3. **Deploy Alexa skill**: `npm run deploy`
4. **Test in Alexa Developer Console**

## Configuration Management

### Local Development

- Interactive setup: `npm run setup`
- Manual setup: Copy `.env.example` to `.env` and edit
- Environment variables loaded automatically

### Production

- AWS Secrets Manager: `npm run setup:aws`
- Encrypted storage with IAM access control
- Automatic retrieval by Lambda function

### Security Features

- `.gitignore` protects sensitive files
- API key validation and testing
- Secure input (hidden passwords)
- Emergency rotation procedures

See [SECURITY.md](SECURITY.md) for complete security guidelines.

## AWS IAM Requirements

The AWS user/role running CDK deployment needs respective permissions.
For this, create a custom IAM policy with the permissions in file [aws-iam-policy.json](aws-iam-policy.json).
The policy could be created with name 'alexa-perplexity-cdk' and assigned to AWS IAM user 'alexa-perplexity-cdk'.

### Setting Up IAM User

1. **Create IAM User:**

   ```bash
   aws iam create-user --user-name perplexity-alexa-deployer
   ```

2. **Attach Policy (choose one option above):**

   ```bash
   # Option 1: Managed policies
   aws iam attach-user-policy --user-name perplexity-alexa-deployer \
     --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
   aws iam attach-user-policy --user-name perplexity-alexa-deployer \
     --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
   
   # Option 2: Custom policy
   aws iam create-policy --policy-name PerplexityAlexaDeployPolicy \
     --policy-document file://policy.json
   aws iam attach-user-policy --user-name perplexity-alexa-deployer \
     --policy-arn arn:aws:iam::ACCOUNT_ID:policy/PerplexityAlexaDeployPolicy
   ```

3. **Create Access Keys:**

   ```bash
   aws iam create-access-key --user-name perplexity-alexa-deployer
   ```

4. **Configure AWS CLI:**

   ```bash
   aws configure
   # Enter the access key ID and secret key from step 3
   ```

### Verifying Permissions

Test your permissions before deployment:

```bash
# Test CloudFormation access
aws cloudformation list-stacks

# Test IAM role creation
aws iam get-role --role-name NonExistentRole 2>/dev/null || echo "IAM access working"

# Test Secrets Manager access
aws secretsmanager list-secrets

# Test Lambda access
aws lambda list-functions
```

### Automated IAM Setup

For convenience, you can use the provided setup script:

```bash
npm run setup:iam
```

This interactive script will:

- Create an IAM user named `perplexity-alexa-deployer`
- Let you choose between managed policies, custom policy, or admin access
- Create access keys
- Provide next steps for AWS CLI configuration

**Manual IAM Policy Creation:**

```bash
# Create the policy using the provided JSON file
aws iam create-policy --policy-name PerplexityAlexaDeployPolicy \
  --policy-document file://aws-iam-policy.json

# Attach to user
aws iam attach-user-policy --user-name your-username \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/PerplexityAlexaDeployPolicy
```