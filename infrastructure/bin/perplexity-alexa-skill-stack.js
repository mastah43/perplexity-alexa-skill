"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerplexityAlexaSkillStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const iam = require("aws-cdk-lib/aws-iam");
const logs = require("aws-cdk-lib/aws-logs");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");
const path = require("path");
class PerplexityAlexaSkillStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const alexaSkillFunction = new lambda.Function(this, 'PerplexityAlexaSkillFunction', {
            functionName: 'perplexity-alexa-skill',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
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
            eventSourceToken: this.node.tryGetContext('alexaSkillId') || 'amzn1.ask.skill.[skill-id-placeholder]',
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
exports.PerplexityAlexaSkillStack = PerplexityAlexaSkillStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVycGxleGl0eS1hbGV4YS1za2lsbC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wZXJwbGV4aXR5LWFsZXhhLXNraWxsLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyxpREFBaUQ7QUFDakQsMkNBQTJDO0FBQzNDLDZDQUE2QztBQUM3QyxpRUFBaUU7QUFFakUsNkJBQTZCO0FBRTdCLE1BQWEseUJBQTBCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDdEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix1Q0FBdUM7UUFDdkMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzlFLFVBQVUsRUFBRSxnQ0FBZ0M7WUFDNUMsV0FBVyxFQUFFLHVDQUF1QztZQUNwRCxvQkFBb0IsRUFBRTtnQkFDcEIsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLGlCQUFpQixFQUFFLFFBQVE7Z0JBQzNCLGlCQUFpQixFQUFFLE9BQU87YUFDM0I7U0FDRixDQUFDLENBQUM7UUFFSCxzQ0FBc0M7UUFDdEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxnQ0FBZ0MsRUFBRTtZQUN0RSxRQUFRLEVBQUUsZ0NBQWdDO1lBQzFDLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxzQkFBc0IsQ0FBQztZQUMzRCxXQUFXLEVBQUUscURBQXFEO1lBQ2xFLGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDO2FBQ3ZGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsc0NBQXNDO1FBQ3RDLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUxQyx5QkFBeUI7UUFDekIsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLDhCQUE4QixFQUFFO1lBQ25GLFlBQVksRUFBRSx3QkFBd0I7WUFDdEMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDakUsSUFBSSxFQUFFLFVBQVU7WUFDaEIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxVQUFVLEVBQUUsR0FBRztZQUNmLFdBQVcsRUFBRTtnQkFDWCwwQkFBMEIsRUFBRSxtQkFBbUIsQ0FBQyxVQUFVO2FBQzNEO1lBQ0QsV0FBVyxFQUFFLDRDQUE0QztTQUMxRCxDQUFDLENBQUM7UUFFSCw2Q0FBNkM7UUFDN0MsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSw4QkFBOEIsRUFBRTtZQUN0RCxZQUFZLEVBQUUsZUFBZSxrQkFBa0IsQ0FBQyxZQUFZLEVBQUU7WUFDOUQsU0FBUyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUztZQUN2QyxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1NBQ3pDLENBQUMsQ0FBQztRQUVILHlEQUF5RDtRQUN6RCxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLEVBQUU7WUFDcEQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDO1lBQzlELE1BQU0sRUFBRSx1QkFBdUI7WUFDL0IsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLElBQUksd0NBQXdDO1NBQ3RHLENBQUMsQ0FBQztRQUVILFVBQVU7UUFDVixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzNDLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxXQUFXO1lBQ3JDLFdBQVcsRUFBRSw0Q0FBNEM7WUFDekQsVUFBVSxFQUFFLCtCQUErQjtTQUM1QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNuQyxLQUFLLEVBQUUsbUJBQW1CLENBQUMsU0FBUztZQUNwQyxXQUFXLEVBQUUsc0NBQXNDO1lBQ25ELFVBQVUsRUFBRSx3QkFBd0I7U0FDckMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPO1lBQ3pCLFdBQVcsRUFBRSxrQ0FBa0M7WUFDL0MsVUFBVSxFQUFFLG1DQUFtQztTQUNoRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE1RUQsOERBNEVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlY3JldHNtYW5hZ2VyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIFBlcnBsZXhpdHlBbGV4YVNraWxsU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBDcmVhdGUgc2VjcmV0IGZvciBQZXJwbGV4aXR5IEFQSSBrZXlcbiAgICBjb25zdCBwZXJwbGV4aXR5QXBpU2VjcmV0ID0gbmV3IHNlY3JldHNtYW5hZ2VyLlNlY3JldCh0aGlzLCAnUGVycGxleGl0eUFwaUtleScsIHtcbiAgICAgIHNlY3JldE5hbWU6ICdwZXJwbGV4aXR5LWFsZXhhLXNraWxsL2FwaS1rZXknLFxuICAgICAgZGVzY3JpcHRpb246ICdQZXJwbGV4aXR5IEFJIEFQSSBrZXkgZm9yIEFsZXhhIHNraWxsJyxcbiAgICAgIGdlbmVyYXRlU2VjcmV0U3RyaW5nOiB7XG4gICAgICAgIHNlY3JldFN0cmluZ1RlbXBsYXRlOiBKU09OLnN0cmluZ2lmeSh7fSksXG4gICAgICAgIGdlbmVyYXRlU3RyaW5nS2V5OiAnYXBpS2V5JyxcbiAgICAgICAgZXhjbHVkZUNoYXJhY3RlcnM6ICdcIkAvXFxcXCcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlIGZvciBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdQZXJwbGV4aXR5QWxleGFTa2lsbExhbWJkYVJvbGUnLCB7XG4gICAgICByb2xlTmFtZTogJ1BlcnBsZXhpdHlBbGV4YVNraWxsTGFtYmRhUm9sZScsXG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnbGFtYmRhLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSUFNIHJvbGUgZm9yIFBlcnBsZXhpdHkgQWxleGEgU2tpbGwgTGFtYmRhIGZ1bmN0aW9uJyxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGUnKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uIHRvIHJlYWQgdGhlIHNlY3JldFxuICAgIHBlcnBsZXhpdHlBcGlTZWNyZXQuZ3JhbnRSZWFkKGxhbWJkYVJvbGUpO1xuXG4gICAgLy8gQ3JlYXRlIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGFsZXhhU2tpbGxGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1BlcnBsZXhpdHlBbGV4YVNraWxsRnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6ICdwZXJwbGV4aXR5LWFsZXhhLXNraWxsJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9sYW1iZGEnKSksXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUEVSUExFWElUWV9BUElfU0VDUkVUX05BTUU6IHBlcnBsZXhpdHlBcGlTZWNyZXQuc2VjcmV0TmFtZSxcbiAgICAgIH0sXG4gICAgICBkZXNjcmlwdGlvbjogJ0xhbWJkYSBmdW5jdGlvbiBmb3IgUGVycGxleGl0eSBBbGV4YSBTa2lsbCcsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBsb2cgZ3JvdXAgd2l0aCByZXRlbnRpb25cbiAgICBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnUGVycGxleGl0eUFsZXhhU2tpbGxMb2dHcm91cCcsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogYC9hd3MvbGFtYmRhLyR7YWxleGFTa2lsbEZ1bmN0aW9uLmZ1bmN0aW9uTmFtZX1gLFxuICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX01PTlRILFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBwZXJtaXNzaW9uIGZvciBBbGV4YSB0byBpbnZva2UgdGhlIExhbWJkYSBmdW5jdGlvblxuICAgIGFsZXhhU2tpbGxGdW5jdGlvbi5hZGRQZXJtaXNzaW9uKCdBbGV4YVNraWxsVHJpZ2dlcicsIHtcbiAgICAgIHByaW5jaXBhbDogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdhbGV4YS1hcHBraXQuYW1hem9uLmNvbScpLFxuICAgICAgYWN0aW9uOiAnbGFtYmRhOkludm9rZUZ1bmN0aW9uJyxcbiAgICAgIGV2ZW50U291cmNlVG9rZW46IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdhbGV4YVNraWxsSWQnKSB8fCAnYW16bjEuYXNrLnNraWxsLltza2lsbC1pZC1wbGFjZWhvbGRlcl0nLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMYW1iZGFGdW5jdGlvbkFybicsIHtcbiAgICAgIHZhbHVlOiBhbGV4YVNraWxsRnVuY3Rpb24uZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0FSTiBvZiB0aGUgTGFtYmRhIGZ1bmN0aW9uIGZvciBBbGV4YSBza2lsbCcsXG4gICAgICBleHBvcnROYW1lOiAnUGVycGxleGl0eUFsZXhhU2tpbGxMYW1iZGFBcm4nLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1NlY3JldEFybicsIHtcbiAgICAgIHZhbHVlOiBwZXJwbGV4aXR5QXBpU2VjcmV0LnNlY3JldEFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVJOIG9mIHRoZSBQZXJwbGV4aXR5IEFQSSBrZXkgc2VjcmV0JyxcbiAgICAgIGV4cG9ydE5hbWU6ICdQZXJwbGV4aXR5QXBpU2VjcmV0QXJuJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMYW1iZGFSb2xlQXJuJywge1xuICAgICAgdmFsdWU6IGxhbWJkYVJvbGUucm9sZUFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVJOIG9mIHRoZSBMYW1iZGEgZXhlY3V0aW9uIHJvbGUnLFxuICAgICAgZXhwb3J0TmFtZTogJ1BlcnBsZXhpdHlBbGV4YVNraWxsTGFtYmRhUm9sZUFybicsXG4gICAgfSk7XG4gIH1cbn0iXX0=