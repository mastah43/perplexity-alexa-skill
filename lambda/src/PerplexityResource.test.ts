import axios from 'axios';
import * as AWS from 'aws-sdk';
import { PerplexityResource } from './PerplexityResource';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock AWS SecretsManager
jest.mock('aws-sdk', () => {
    const mockGetSecretValue = jest.fn();
    return {
        SecretsManager: jest.fn().mockImplementation(() => ({
            getSecretValue: mockGetSecretValue
        }))
    };
});

describe('PerplexityResource', () => {
    let perplexityResource: PerplexityResource;
    let mockGetSecretValue: jest.Mock;
    const expectedPerplexityOutput: string = 'This is a test response from Perplexity AI'

    beforeEach(() => {
        jest.clearAllMocks();

        // Ensure PERPLEXITY_API_KEY is not set so it uses Secrets Manager
        delete process.env.PERPLEXITY_API_KEY;

        // Set up environment variable for secret name
        process.env.PERPLEXITY_API_SECRET_NAME = 'test-secret-name';

        // Get reference to the mocked getSecretValue function
        const SecretsManager = AWS.SecretsManager as jest.MockedClass<typeof AWS.SecretsManager>;
        const mockSecretsManagerInstance = new SecretsManager();
        mockGetSecretValue = mockSecretsManagerInstance.getSecretValue as jest.Mock;

        mockGetSecretValue.mockReturnValue({
            promise: jest.fn().mockResolvedValue({
                SecretString: JSON.stringify({ apiKey: 'test-api-key' })
            })
        });

        mockedAxios.post.mockResolvedValue({
            data: {
                choices: [
                    {
                        message: {
                            content: expectedPerplexityOutput
                        }
                    }
                ]
            }
        });

        perplexityResource = new PerplexityResource();
    });

    afterEach(() => {
        delete process.env.PERPLEXITY_API_SECRET_NAME;
        delete process.env.PERPLEXITY_API_KEY;
    });

    describe('query', () => {
        it('should return a non-empty response when locale is provided', async () => {
            const response = await perplexityResource.query('test query', 'en-US');

            expect(response).toEqual(expectedPerplexityOutput);

            expect(mockedAxios.post).toHaveBeenCalledTimes(1);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.perplexity.ai/chat/completions',
                expect.objectContaining({
                    model: 'sonar',
                    messages: [
                        {
                            role: 'user',
                            content: 'test query'
                        }
                    ],
                    preferred_language: 'en'
                }),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key',
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('should return a non-empty response when locale is not provided', async () => {
            const response = await perplexityResource.query('test query');

            expect(response).toEqual(expectedPerplexityOutput);

            expect(mockedAxios.post).toHaveBeenCalledTimes(1);

            const callArgs = mockedAxios.post.mock.calls[0];
            const requestBody = callArgs[1] as any;

            expect(requestBody).not.toHaveProperty('preferred_language');
        });
    });
});
