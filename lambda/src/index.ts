import * as Alexa from 'ask-sdk-core';
import { RequestEnvelope, Response } from 'ask-sdk-model';
import axios from 'axios';

/**
 * Handler for LaunchRequest - when user opens the skill without a specific intent
 */
const LaunchRequestHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput: Alexa.HandlerInput): Response {
        const speakOutput = 'Welcome to Perplexity AI! Ask me any question and I\'ll search for the answer.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for AskPerplexityIntent - processes user queries through Perplexity API
 */
const AskPerplexityIntentHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskPerplexityIntent';
    },
    async handle(handlerInput: Alexa.HandlerInput): Promise<Response> {
        const requestEnvelope: RequestEnvelope = handlerInput.requestEnvelope;
        const slots = (requestEnvelope.request as any).intent?.slots;
        const query: string | undefined = slots?.query?.value;

        if (!query) {
            const speakOutput = 'I didn\'t catch your question. Please try asking again.';
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('What would you like to know?')
                .getResponse();
        }

        try {
            const response = await queryPerplexity(query);
            const speakOutput = response || 'I couldn\'t find an answer to your question. Please try asking something else.';

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('Do you have another question?')
                .getResponse();
        } catch (error) {
            console.error('Error querying Perplexity:', error);
            const speakOutput = 'Sorry, I encountered an error while searching for your answer. Please try again later.';

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt('What would you like to know?')
                .getResponse();
        }
    }
};

/**
 * Handler for AMAZON.HelpIntent - provides help information
 */
const HelpIntentHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput: Alexa.HandlerInput): Response {
        const speakOutput = 'You can ask me any question and I\'ll search for the answer using Perplexity AI. For example, you can say "Ask me about the weather" or "What is artificial intelligence?"';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for AMAZON.CancelIntent and AMAZON.StopIntent
 */
const CancelAndStopIntentHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput: Alexa.HandlerInput): Response {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/**
 * Handler for AMAZON.FallbackIntent - handles unknown requests
 */
const FallbackIntentHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput: Alexa.HandlerInput): Response {
        const speakOutput = 'Sorry, I don\'t know about that. You can ask me any question and I\'ll search for the answer.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What would you like to know?')
            .getResponse();
    }
};

/**
 * Handler for SessionEndedRequest - cleanup when session ends
 */
const SessionEndedRequestHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput: Alexa.HandlerInput): Response {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

/**
 * Intent reflector handler - for debugging purposes
 */
const IntentReflectorHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput: Alexa.HandlerInput): Response {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

/**
 * Generic error handler
 */
const ErrorHandler: Alexa.ErrorHandler = {
    canHandle(): boolean {
        return true;
    },
    handle(handlerInput: Alexa.HandlerInput, error: Error): Response {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

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
 * Query Perplexity AI API
 * @param query - The user's question
 * @returns The AI-generated response
 */
async function queryPerplexity(query: string): Promise<string> {
    let apiKey = process.env.PERPLEXITY_API_KEY;

    // If using AWS Secrets Manager
    if (process.env.PERPLEXITY_API_SECRET_NAME && !apiKey) {
        const AWS = require('aws-sdk');
        const secretsManager = new AWS.SecretsManager();

        try {
            const secretValue = await secretsManager.getSecretValue({
                SecretId: process.env.PERPLEXITY_API_SECRET_NAME
            }).promise();

            const secret = JSON.parse(secretValue.SecretString);
            apiKey = secret.apiKey;
        } catch (error) {
            console.error('Error retrieving API key from Secrets Manager:', error);
            throw new Error('Failed to retrieve API key');
        }
    }

    if (!apiKey) {
        throw new Error('Perplexity API key not configured');
    }

    const response = await axios.post<PerplexityResponse>('https://api.perplexity.ai/chat/completions', {
        model: "sonar",
        messages: [
            {
                role: 'user',
                content: query
            }
        ],
        max_tokens: 150,
        temperature: 0.2
    }, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data.choices[0].message.content;
}

/**
 * Lambda handler for Alexa skill
 */
export const handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        AskPerplexityIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('perplexity-alexa-skill/v1.0')
    .lambda();
