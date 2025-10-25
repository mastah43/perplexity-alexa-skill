# Local Development

This directory contains tools for local Lambda development and testing.

## Quick Start

```bash
# Start local development server
npm run dev:start

# In another terminal, run HTTP tests
npm run dev:test
```

## Local Development Server

The local development server (`local-lambda.js`) provides:

- **Express.js wrapper** around the Lambda function
- **HTTP endpoint** at `POST /lambda` for testing Alexa requests
- **Health check** at `GET /health`
- **Mock Lambda context** for realistic testing
- **Automatic request/response logging**

### Starting the Server

```bash
# Install dependencies and start server
npm run dev:start

# Or with auto-reload on file changes
npm run dev:watch
```

Server runs on `http://localhost:3000` by default.

## Testing

### HTTP Request Testing

Run the automated HTTP test suite:

```bash
npm run dev:test
```

This tests:
- Health check endpoint
- Alexa LaunchRequest
- Alexa HelpIntent  
- Alexa AskPerplexityIntent (requires API key)

### Manual Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# Test LaunchRequest
curl -X POST http://localhost:3000/lambda \
  -H "Content-Type: application/json" \
  -d @../test/fixtures/alexa-launch-request.json

# Test query with your own question
curl -X POST http://localhost:3000/lambda \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0",
    "session": {"new": false, "sessionId": "test", "application": {"applicationId": "test"}},
    "request": {
      "type": "IntentRequest",
      "intent": {
        "name": "AskPerplexityIntent",
        "slots": {"query": {"value": "What is machine learning?"}}
      }
    }
  }'
```

## SAM CLI Integration

Use AWS SAM CLI for more advanced local testing:

```bash
# Start SAM local API Gateway
export PERPLEXITY_API_KEY=your-api-key
npm run sam:start

# Invoke function directly with test event
npm run sam:invoke
```

SAM provides:
- More realistic AWS Lambda environment
- API Gateway simulation
- Environment variable support
- CloudWatch logs simulation

## Environment Variables

For testing with real Perplexity API:

```bash
# Set your API key
export PERPLEXITY_API_KEY=your-perplexity-api-key

# Start the server
npm run dev:start
```

## Debugging

The local server provides detailed logging:
- Incoming requests are logged with full JSON
- Lambda responses are logged  
- Errors include full stack traces
- Health endpoint shows server status

Check the console output for debugging information.

## Files

- `local-lambda.js` - Express server wrapping Lambda function
- `test-requests.js` - Automated HTTP test suite
- `package.json` - Local development dependencies