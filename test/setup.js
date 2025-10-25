// Jest setup file for Lambda tests

// Load environment variables from .env file for testing
require('dotenv').config();

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'test-api-key';

// Mock axios for HTTP tests
jest.mock('axios');

// Global test utilities
global.createMockContext = () => ({
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'perplexity-alexa-skill-test',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:perplexity-alexa-skill-test',
  memoryLimitInMB: '256',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/perplexity-alexa-skill-test',
  logStreamName: '2023/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000
});

// Mock Perplexity API response
global.mockPerplexityResponse = {
  data: {
    choices: [{
      message: {
        content: 'This is a test response from Perplexity AI about artificial intelligence.'
      }
    }]
  }
};