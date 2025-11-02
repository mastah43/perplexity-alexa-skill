import { Context } from 'aws-lambda';

// Create the mock BEFORE importing anything else
const mockPerplexityQuery = jest.fn();
jest.mock('./PerplexityResource', () => {
    return {
        PerplexityResource: jest.fn().mockImplementation(() => ({
            query: mockPerplexityQuery,
        })),
    };
});

// Import handler AFTER setting up mock
import { handler } from './index';

describe('Alexa Skill Handlers', () => {
    let context: Context;

    /**
     * Helper function to create a Lambda context
     */
    const createContext = (): Context => ({
        callbackWaitsForEmptyEventLoop: true,
        functionName: 'test-function',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
        memoryLimitInMB: '128',
        awsRequestId: 'test-request-id',
        logGroupName: '/aws/lambda/test',
        logStreamName: 'test-stream',
        getRemainingTimeInMillis: () => 30000,
        done: () => {},
        fail: () => {},
        succeed: () => {},
    });

    /**
     * Helper function to create a base Alexa request event
     */
    const createAlexaEvent = (requestType: string, intentName?: string, slots?: any) => ({
        version: '1.0',
        session: {
            new: requestType === 'LaunchRequest',
            sessionId: 'test-session-id',
            application: { applicationId: 'test-app-id' },
            user: { userId: 'test-user-id' },
        },
        request: {
            type: requestType,
            requestId: 'test-request-id',
            timestamp: new Date().toISOString(),
            locale: 'en-US',
            ...(intentName && {
                intent: {
                    name: intentName,
                    confirmationStatus: 'NONE',
                    ...(slots && { slots }),
                },
            }),
            ...(requestType === 'SessionEndedRequest' && { reason: 'USER_INITIATED' }),
        },
        context: {
            System: {
                application: { applicationId: 'test-app-id' },
                user: { userId: 'test-user-id' },
                device: { deviceId: 'test-device-id', supportedInterfaces: {} },
                apiEndpoint: 'https://api.amazonalexa.com',
                apiAccessToken: 'test-token',
            },
        },
    });

    /**
     * Helper to invoke handler and get response via callback
     */
    const invokeHandler = (event: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            handler(event, context, (error: any, response: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Initialize context
        context = createContext();
    });

    describe('LaunchRequest', () => {
        it('should return welcome message', async () => {
            const event = createAlexaEvent('LaunchRequest');
            const response = await invokeHandler(event);

            expect(response.response.outputSpeech).toEqual({
                type: 'SSML',
                ssml: '<speak>Welcome to Perplexity AI! Ask me any question and I\'ll search for the answer.</speak>',
            });
            expect(response.response.shouldEndSession).toBe(false);
        });
    });

    describe('AskPerplexityIntent', () => {
        it('should query Perplexity and return response', async () => {
            const mockAnswer = 'The capital of France is Paris.';
            mockPerplexityQuery.mockResolvedValue(mockAnswer);

            const event = createAlexaEvent('IntentRequest', 'AskPerplexityIntent', {
                query: {
                    name: 'query',
                    value: 'What is the capital of France?',
                    confirmationStatus: 'NONE',
                },
            });

            const response = await invokeHandler(event);

            // Check if query was called
            expect(mockPerplexityQuery).toHaveBeenCalled();
            expect(mockPerplexityQuery).toHaveBeenCalledWith('What is the capital of France?');
            expect(response.response.outputSpeech).toEqual({
                type: 'SSML',
                ssml: `<speak>${mockAnswer}</speak>`,
            });
            expect(response.response.shouldEndSession).toBe(false);
        });

        it('should handle missing query slot', async () => {
            const event = createAlexaEvent('IntentRequest', 'AskPerplexityIntent', {});
            const response = await invokeHandler(event);

            expect(mockPerplexityQuery).not.toHaveBeenCalled();
            expect(response.response.outputSpeech).toEqual({
                type: 'SSML',
                ssml: '<speak>I didn\'t catch your question. Please try asking again.</speak>',
            });
        });

        it('should handle Perplexity API errors gracefully', async () => {
            mockPerplexityQuery.mockRejectedValue(new Error('API Error'));

            const event = createAlexaEvent('IntentRequest', 'AskPerplexityIntent', {
                query: {
                    name: 'query',
                    value: 'test question',
                    confirmationStatus: 'NONE',
                },
            });

            const response = await invokeHandler(event);

            // When API fails, the catch block triggers
            expect(response.response.outputSpeech?.ssml).toContain('Sorry, I encountered an error');
        });
    });

    describe('AMAZON.HelpIntent', () => {
        it('should return help message', async () => {
            const event = createAlexaEvent('IntentRequest', 'AMAZON.HelpIntent');
            const response = await invokeHandler(event);

            expect(response.response.outputSpeech?.ssml).toContain('You can ask me any question');
            expect(response.response.shouldEndSession).toBe(false);
        });
    });

    describe('AMAZON.CancelIntent and AMAZON.StopIntent', () => {
        it('should handle CancelIntent', async () => {
            const event = createAlexaEvent('IntentRequest', 'AMAZON.CancelIntent');
            const response = await invokeHandler(event);

            expect(response.response.outputSpeech).toEqual({
                type: 'SSML',
                ssml: '<speak>Goodbye!</speak>',
            });
            // shouldEndSession is not explicitly set, SDK decides based on no reprompt
        });

        it('should handle StopIntent', async () => {
            const event = createAlexaEvent('IntentRequest', 'AMAZON.StopIntent');
            const response = await invokeHandler(event);

            expect(response.response.outputSpeech).toEqual({
                type: 'SSML',
                ssml: '<speak>Goodbye!</speak>',
            });
            // shouldEndSession is not explicitly set, SDK decides based on no reprompt
        });
    });

    describe('AMAZON.FallbackIntent', () => {
        it('should handle fallback intent', async () => {
            const event = createAlexaEvent('IntentRequest', 'AMAZON.FallbackIntent');
            const response = await invokeHandler(event);

            expect(response.response.outputSpeech?.ssml).toContain('Sorry, I don\'t know about that');
            expect(response.response.shouldEndSession).toBe(false);
        });
    });

    describe('SessionEndedRequest', () => {
        it('should handle session ended', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const event = createAlexaEvent('SessionEndedRequest');
            const response = await invokeHandler(event);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('~~~~ Session ended:'));
            // Response exists but session is ended

            consoleSpy.mockRestore();
        });
    });

    describe('ErrorHandler', () => {
        it('should handle errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            // Create an invalid event that will trigger the error handler
            const event = {
                ...createAlexaEvent('IntentRequest'),
                request: {
                    ...createAlexaEvent('IntentRequest').request,
                    intent: null, // This will cause an error
                },
            };

            const response = await invokeHandler(event);

            expect(response.response.outputSpeech?.ssml).toContain('Sorry, I had trouble doing what you asked');

            consoleSpy.mockRestore();
        });
    });
});
