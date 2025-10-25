# Perplexity Alexa Skill Infrastructure

This directory contains AWS CDK infrastructure code for deploying the Perplexity Alexa Skill.

## Architecture

The CDK stack deploys:

- **Lambda Function**: Hosts the Alexa skill logic
- **IAM Role**: Provides necessary permissions for Lambda execution
- **AWS Secrets Manager**: Securely stores the Perplexity API key
- **CloudWatch Log Group**: Centralized logging with 30-day retention
- **Lambda Permissions**: Allows Alexa to invoke the function

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 14+
- CDK CLI installed (`npm install -g aws-cdk`)

## Deployment

### Quick Deploy

```bash
# From project root
npm run cdk:deploy
```

### Manual Deploy

```bash
cd infrastructure
npm install
npm run build
npm run deploy
```

## Configuration

### Perplexity API Key

After deployment, update the API key in AWS Secrets Manager:

```bash
# Get the secret name from CDK outputs
aws secretsmanager put-secret-value \
  --secret-id perplexity-alexa-skill/api-key \
  --secret-string '{"apiKey":"your-perplexity-api-key"}'
```

### Alexa Skill ID

Update the skill ID in CDK context:

```bash
npx cdk deploy -c alexaSkillId=amzn1.ask.skill.your-skill-id
```

## Management Commands

```bash
# View differences before deployment
npm run cdk:diff

# Generate CloudFormation template
npm run cdk:synth

# Destroy infrastructure
npm run cdk:destroy
```

## Outputs

After deployment, the stack provides:

- `LambdaFunctionArn`: Use this ARN in your Alexa skill configuration
- `SecretArn`: Reference to the Perplexity API key secret
- `LambdaRoleArn`: IAM role used by the Lambda function

## Security

- API key is stored securely in AWS Secrets Manager
- Lambda function has minimal IAM permissions
- CloudWatch logs for monitoring and debugging
- Alexa service principal restricted to specific skill ID