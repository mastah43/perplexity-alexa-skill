import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';

export class PerplexityAlexaSkillStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create secret for Perplexity API key
    const perplexityApiSecret = new secretsmanager.Secret(this, 'PerplexityApiKey', {
      secretName: 'perplexity-alexa-skill/api-key',
      description: 'Perplexity AI API key for Alexa skill',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: 'apiKey',
        excludeCharacters: '"@/\\',
      },
    });

    // Create IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'PerplexityAlexaSkillLambdaRole', {
      roleName: 'PerplexityAlexaSkillLambdaRole',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for Perplexity Alexa Skill Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permission to read the secret
    perplexityApiSecret.grantRead(lambdaRole);

    // Create Lambda function
    // Bundle from the lambda root directory to include both dist/ and node_modules/
    const alexaSkillFunction = new lambda.Function(this, 'PerplexityAlexaSkillFunction', {
      functionName: 'perplexity-alexa-skill',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c',
            [
              'echo "Installing production dependencies..."',
              'cp package.json package-lock.json /asset-output/',
              'cd /asset-output',
              'npm ci --omit=dev --quiet --cache /tmp/npm-cache',
              'echo "Copying compiled Lambda code..."',
              'cp -r /asset-input/dist/* /asset-output/',
              'echo "Lambda bundle complete"',
            ].join(' && '),
          ],
        },
      }),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        PERPLEXITY_API_SECRET_NAME: perplexityApiSecret.secretName,
      },
      description: 'Lambda function for Perplexity Alexa Skill',
    });

    // Create CloudWatch log group with retention
    new logs.LogGroup(this, 'PerplexityAlexaSkillLogGroup', {
      logGroupName: `/aws/lambda/${alexaSkillFunction.functionName}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add permission for Alexa to invoke the Lambda function
    alexaSkillFunction.addPermission('AlexaSkillTrigger', {
      principal: new iam.ServicePrincipal('alexa-appkit.amazon.com'),
      action: 'lambda:InvokeFunction',
      eventSourceToken: this.node.tryGetContext('alexaSkillId') || 'amzn1.ask.skill.skill-id-placeholder',
    });

    // Outputs
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: alexaSkillFunction.functionArn,
      description: 'ARN of the Lambda function for Alexa skill',
      exportName: 'PerplexityAlexaSkillLambdaArn',
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: perplexityApiSecret.secretArn,
      description: 'ARN of the Perplexity API key secret',
      exportName: 'PerplexityApiSecretArn',
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'ARN of the Lambda execution role',
      exportName: 'PerplexityAlexaSkillLambdaRoleArn',
    });
  }
}