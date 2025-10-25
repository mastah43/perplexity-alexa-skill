const http = require('http');
const app = require('../../local-dev/local-lambda');

describe('HTTP Integration Tests', () => {
  let server;
  const PORT = 3001; // Use different port for testing

  beforeAll((done) => {
    server = app.listen(PORT, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  const makeRequest = (options, data) => {
    return new Promise((resolve, reject) => {
      const req = http.request({
        ...options,
        hostname: 'localhost',
        port: PORT
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: parsedBody
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body
            });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  };

  describe('Health Check Endpoint', () => {
    test('GET /health should return healthy status', async () => {
      const response = await makeRequest({
        path: '/health',
        method: 'GET'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Lambda Endpoint', () => {
    test('POST /lambda should handle Alexa LaunchRequest', async () => {
      const launchRequest = require('../fixtures/alexa-launch-request.json');
      
      const response = await makeRequest({
        path: '/lambda',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, launchRequest);

      expect(response.statusCode).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.response.outputSpeech).toBeDefined();
      expect(response.body.response.outputSpeech.text).toContain('Welcome to Perplexity AI');
    });

    test('POST /lambda should handle Alexa HelpIntent', async () => {
      const helpRequest = require('../fixtures/alexa-help-request.json');
      
      const response = await makeRequest({
        path: '/lambda',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, helpRequest);

      expect(response.statusCode).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.response.outputSpeech.text).toContain('You can ask me any question');
    });

    test('POST /lambda should handle invalid JSON', async () => {
      const response = await makeRequest({
        path: '/lambda',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, '{ invalid json }');

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    test('POST /lambda should handle missing request body', async () => {
      const response = await makeRequest({
        path: '/lambda',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown endpoints', async () => {
      const response = await makeRequest({
        path: '/unknown',
        method: 'GET'
      });

      expect(response.statusCode).toBe(404);
    });

    test('should handle malformed Alexa request', async () => {
      const malformedRequest = { invalid: 'alexa request' };
      
      const response = await makeRequest({
        path: '/lambda',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, malformedRequest);

      expect(response.statusCode).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.response.outputSpeech.text).toContain('trouble doing what you asked');
    });
  });
});