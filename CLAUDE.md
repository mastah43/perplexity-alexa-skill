# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Perplexity Alexa Skill that forwards user queries to the Perplexity AI API and reads back intelligent responses through Amazon Alexa.

## Development Commands

- `npm install` - Install dependencies
- `ask deploy` - Deploy the skill to AWS Lambda and Alexa
- `npm run build` - Alias for npm install

### Configuration Setup
- `npm run setup` - Interactive local API key setup (creates .env file)
- `npm run setup:aws` - AWS Secrets Manager setup for production
- `npm run setup:iam` - Automated IAM user and policy setup for CDK deployment

### Local Development
- `npm run dev:start` - Start local Lambda development server
- `npm run dev:watch` - Start server with auto-reload
- `npm run dev:test` - Run HTTP tests against local server

### Testing
- `npm test` - Run Jest unit and integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### SAM CLI
- `npm run sam:start` - Start SAM local API Gateway
- `npm run sam:invoke` - Invoke Lambda function directly

### CDK Infrastructure
- `npm run cdk:deploy` - Deploy AWS infrastructure using CDK
- `npm run cdk:destroy` - Destroy AWS infrastructure
- `npm run cdk:synth` - Generate CloudFormation template
- `npm run cdk:diff` - View infrastructure changes

## Architecture

- **lambda/index.js** - Main Lambda function handler with Alexa SDK integration
- **skill-package/** - Alexa skill configuration
  - **interactionModels/custom/en-US.json** - Voice interaction model and intents
  - **skill.json** - Skill manifest with metadata and configuration
- **.ask/** - ASK CLI deployment configuration
- **infrastructure/** - AWS CDK infrastructure as code
  - **lib/perplexity-alexa-skill-stack.ts** - CDK stack definition
  - **bin/infrastructure.ts** - CDK app entry point
- **local-dev/** - Local development and testing tools
  - **local-lambda.js** - Express server wrapping Lambda function
  - **test-requests.js** - HTTP test suite
- **test/** - Jest test framework and fixtures
  - **fixtures/** - Sample Alexa request payloads
  - **integration/** - Lambda and HTTP integration tests
- **scripts/** - Configuration and setup utilities
  - **setup-config.js** - Interactive local API key setup
  - **aws-secrets-setup.sh** - AWS Secrets Manager configuration

## Key Components

- **AskPerplexityIntent** - Main intent that processes user queries and calls Perplexity API
- **queryPerplexity()** - Function that handles API calls to Perplexity AI
- **AWS Secrets Manager** - Securely stores Perplexity API key
- **CloudWatch Logs** - Centralized logging with 30-day retention

## API Integration

The skill uses Perplexity's `llama-3.1-sonar-small-128k-online` model with:
- Max tokens: 150 (optimized for voice responses)
- Temperature: 0.2 (focused responses)
- Top-p: 0.9

## Security

- **Local Development**: API keys in `.env` files (excluded from git via `.gitignore`)
- **Production**: API keys stored in AWS Secrets Manager (`perplexity-alexa-skill/api-key`)
- **Setup Scripts**: Interactive, secure configuration with validation
- **IAM Permissions**: Minimal permissions for Lambda execution and secret access
- **Access Control**: Alexa service principal restricted to specific skill ID

## Configuration Management

- **`npm run setup`** - Interactive local setup (creates .env file securely)
- **`npm run setup:aws`** - AWS Secrets Manager configuration  
- **Automatic Loading**: dotenv integration for development, Secrets Manager for production
- **Security Features**: Hidden password input, API key validation, connection testing

See SECURITY.md for complete security guidelines.