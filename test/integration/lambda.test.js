const axios = require('axios');
const { handler } = require('../../lambda/index');
const launchRequest = require('../fixtures/alexa-launch-request.json');
const queryRequest = require('../fixtures/alexa-query-request.json');
const helpRequest = require('../fixtures/alexa-help-request.json');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('Perplexity Alexa Skill Lambda Tests', () => {
  let context;

  beforeEach(() => {
    context = createMockContext();
    jest.clearAllMocks();
  });

  describe('LaunchRequest', () => {
    test('should return welcome message', async () => {
      const result = await handler(launchRequest, context);

      expect(result.response).toBeDefined();
      expect(result.response.outputSpeech).toBeDefined();
      expect(result.response.outputSpeech.text).toContain('Welcome to Perplexity AI');
      expect(result.response.shouldEndSession).toBeFalsy();
    });

    test('should include reprompt', async () => {
      const result = await handler(launchRequest, context);

      expect(result.response.reprompt).toBeDefined();
      expect(result.response.reprompt.outputSpeech).toBeDefined();
    });
  });

  describe('HelpIntent', () => {
    test('should return help message', async () => {
      const result = await handler(helpRequest, context);

      expect(result.response).toBeDefined();
      expect(result.response.outputSpeech.text).toContain('You can ask me any question');
      expect(result.response.shouldEndSession).toBeFalsy();
    });
  });

  describe('AskPerplexityIntent', () => {
    test('should handle valid query with API response', async () => {
      // Mock successful Perplexity API response
      mockedAxios.post.mockResolvedValueOnce(mockPerplexityResponse);

      const result = await handler(queryRequest, context);

      expect(result.response).toBeDefined();
      expect(result.response.outputSpeech.text).toContain('test response from Perplexity AI');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'What is artificial intelligence?'
            })
          ])
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should handle missing query slot', async () => {
      const invalidRequest = {
        ...queryRequest,
        request: {
          ...queryRequest.request,
          intent: {
            ...queryRequest.request.intent,
            slots: {
              query: {
                name: 'query',
                confirmationStatus: 'NONE',
                source: 'USER'
                // No value property
              }
            }
          }
        }
      };

      const result = await handler(invalidRequest, context);

      expect(result.response.outputSpeech.text).toContain('didn\'t catch your question');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    test('should handle Perplexity API error', async () => {
      // Mock API error
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await handler(queryRequest, context);

      expect(result.response.outputSpeech.text).toContain('encountered an error');
    });

    test('should handle missing API key', async () => {
      // Temporarily remove API key
      const originalApiKey = process.env.PERPLEXITY_API_KEY;
      delete process.env.PERPLEXITY_API_KEY;

      const result = await handler(queryRequest, context);

      expect(result.response.outputSpeech.text).toContain('encountered an error');
      
      // Restore API key
      process.env.PERPLEXITY_API_KEY = originalApiKey;
    });
  });

  describe('StopIntent', () => {
    test('should end session with goodbye message', async () => {
      const stopRequest = {
        ...helpRequest,
        request: {
          ...helpRequest.request,
          intent: {
            name: 'AMAZON.StopIntent',
            confirmationStatus: 'NONE'
          }
        }
      };

      const result = await handler(stopRequest, context);

      expect(result.response.outputSpeech.text).toBe('Goodbye!');
      expect(result.response.shouldEndSession).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle unexpected errors gracefully', async () => {
      const malformedRequest = { invalid: 'request' };

      const result = await handler(malformedRequest, context);

      expect(result.response).toBeDefined();
      expect(result.response.outputSpeech.text).toContain('trouble doing what you asked');
    });
  });

  describe('SessionEndedRequest', () => {
    test('should handle session end', async () => {
      const sessionEndRequest = {
        ...launchRequest,
        request: {
          type: 'SessionEndedRequest',
          requestId: 'amzn1.echo-api.request.test-request-id',
          timestamp: '2023-01-01T00:00:00Z',
          locale: 'en-US',
          reason: 'USER_INITIATED'
        }
      };

      const result = await handler(sessionEndRequest, context);

      expect(result.response).toBeDefined();
      // SessionEndedRequest should not return speech
      expect(result.response.outputSpeech).toBeUndefined();
    });
  });
});