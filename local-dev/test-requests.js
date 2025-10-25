const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_FIXTURES_DIR = path.join(__dirname, '../test/fixtures');

// Helper function to make HTTP requests
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: JSON.parse(body)
                });
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Load test fixture
function loadFixture(filename) {
    const filePath = path.join(TEST_FIXTURES_DIR, filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Test runner
async function runTests() {
    console.log('🧪 Starting Lambda HTTP tests...\n');

    try {
        // Test 1: Health check
        console.log('1️⃣  Testing health check...');
        const healthResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/health',
            method: 'GET'
        });
        
        if (healthResponse.statusCode === 200) {
            console.log('✅ Health check passed');
            console.log(`   Status: ${healthResponse.body.status}`);
        } else {
            console.log('❌ Health check failed');
            console.log(`   Status Code: ${healthResponse.statusCode}`);
        }
        console.log();

        // Test 2: Launch request
        console.log('2️⃣  Testing Alexa Launch Request...');
        const launchRequest = loadFixture('alexa-launch-request.json');
        const launchResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/lambda',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, launchRequest);

        if (launchResponse.statusCode === 200 && launchResponse.body.response) {
            console.log('✅ Launch request passed');
            console.log(`   Response: ${launchResponse.body.response.outputSpeech.text}`);
        } else {
            console.log('❌ Launch request failed');
            console.log(`   Status Code: ${launchResponse.statusCode}`);
            console.log(`   Error: ${JSON.stringify(launchResponse.body, null, 2)}`);
        }
        console.log();

        // Test 3: Help request
        console.log('3️⃣  Testing Alexa Help Request...');
        const helpRequest = loadFixture('alexa-help-request.json');
        const helpResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/lambda',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, helpRequest);

        if (helpResponse.statusCode === 200 && helpResponse.body.response) {
            console.log('✅ Help request passed');
            console.log(`   Response: ${helpResponse.body.response.outputSpeech.text.substring(0, 100)}...`);
        } else {
            console.log('❌ Help request failed');
            console.log(`   Status Code: ${helpResponse.statusCode}`);
            console.log(`   Error: ${JSON.stringify(helpResponse.body, null, 2)}`);
        }
        console.log();

        // Test 4: Query request (will fail without API key)
        console.log('4️⃣  Testing Alexa Query Request...');
        const queryRequest = loadFixture('alexa-query-request.json');
        const queryResponse = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/lambda',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, queryRequest);

        if (queryResponse.statusCode === 200) {
            if (queryResponse.body.response && queryResponse.body.response.outputSpeech) {
                console.log('✅ Query request handled');
                console.log(`   Response: ${queryResponse.body.response.outputSpeech.text.substring(0, 100)}...`);
            } else {
                console.log('⚠️  Query request returned unexpected format');
                console.log(`   Body: ${JSON.stringify(queryResponse.body, null, 2)}`);
            }
        } else {
            console.log('❌ Query request failed');
            console.log(`   Status Code: ${queryResponse.statusCode}`);
            console.log(`   Error: ${JSON.stringify(queryResponse.body, null, 2)}`);
        }

        console.log('\n🏁 Tests completed!');
        console.log('\n💡 Note: Query tests will fail without a valid PERPLEXITY_API_KEY environment variable');

    } catch (error) {
        console.error('❌ Test runner error:', error.message);
        console.log('\n💡 Make sure the local server is running: npm run dev:start');
        process.exit(1);
    }
}

// Check if server is running before starting tests
async function checkServer() {
    try {
        await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/health',
            method: 'GET'
        });
        return true;
    } catch (error) {
        return false;
    }
}

// Main execution
async function main() {
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
        console.log('❌ Local server not running on http://localhost:3000');
        console.log('💡 Start the server first: npm run dev:start');
        process.exit(1);
    }

    await runTests();
}

main();