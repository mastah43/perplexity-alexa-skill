// Load environment variables from .env file
require('dotenv').config({ path: '../.env' });

const express = require('express');
const { handler } = require('../lambda/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Lambda function endpoint
app.post('/lambda', async (req, res) => {
    try {
        console.log('Received request:', JSON.stringify(req.body, null, 2));
        
        // Create mock context
        const context = {
            callbackWaitsForEmptyEventLoop: false,
            functionName: 'perplexity-alexa-skill-local',
            functionVersion: '$LATEST',
            invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:perplexity-alexa-skill-local',
            memoryLimitInMB: '256',
            awsRequestId: 'local-' + Date.now(),
            logGroupName: '/aws/lambda/perplexity-alexa-skill-local',
            logStreamName: new Date().toISOString().replace(/[:.]/g, '-'),
            getRemainingTimeInMillis: () => 30000
        };

        // Call the Lambda handler
        const result = await handler(req.body, context);
        
        console.log('Lambda response:', JSON.stringify(result, null, 2));
        res.json(result);
    } catch (error) {
        console.error('Lambda error:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Local Lambda server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`⚡ Lambda endpoint: http://localhost:${PORT}/lambda`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;