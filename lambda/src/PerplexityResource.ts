import axios from 'axios';
import * as AWS from 'aws-sdk';

/**
 * Interface for Perplexity API response
 */
interface PerplexityResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

/**
 * Resource class for interacting with Perplexity AI API
 */
export class PerplexityResource {
    private apiKey: string | null = null;
    private readonly apiUrl = 'https://api.perplexity.ai/chat/completions';
    private readonly model = 'sonar';
    private readonly maxTokens = 150;
    private readonly temperature = 0.2;

    /**
     * Query Perplexity AI API
     * @param query - The user's question
     * @returns The AI-generated response
     */
    async query(query: string): Promise<string> {
        const apiKey = await this.getApiKey();

        const response = await axios.post<PerplexityResponse>(this.apiUrl, {
            model: this.model,
            messages: [
                {
                    role: 'user',
                    content: query
                }
            ],
            max_tokens: this.maxTokens,
            temperature: this.temperature
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    /**
     * Retrieve API key from environment variable or AWS Secrets Manager
     * @returns The Perplexity API key
     * @throws Error if API key cannot be retrieved
     */
    private async getApiKey(): Promise<string> {
        // Return cached API key if available
        if (this.apiKey) {
            return this.apiKey;
        }

        // Try to get from environment variable first
        this.apiKey = process.env.PERPLEXITY_API_KEY || null;

        // If using AWS Secrets Manager
        if (process.env.PERPLEXITY_API_SECRET_NAME && !this.apiKey) {
            this.apiKey = await this.getApiKeyFromSecretsManager();
        }

        if (!this.apiKey) {
            throw new Error('Perplexity API key not configured');
        }

        return this.apiKey;
    }

    /**
     * Retrieve API key from AWS Secrets Manager
     * @returns The API key from Secrets Manager
     * @throws Error if retrieval fails
     */
    private async getApiKeyFromSecretsManager(): Promise<string> {
        const secretsManager = new AWS.SecretsManager();

        try {
            const secretValue = await secretsManager.getSecretValue({
                SecretId: process.env.PERPLEXITY_API_SECRET_NAME!
            }).promise();

            const secret = JSON.parse(secretValue.SecretString!);
            return secret.apiKey;
        } catch (error) {
            console.error('Error retrieving API key from Secrets Manager:', error);
            throw new Error('Failed to retrieve API key from Secrets Manager');
        }
    }
}
