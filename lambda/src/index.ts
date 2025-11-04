import * as Alexa from 'ask-sdk-core';
import { RequestEnvelope, Response } from 'ask-sdk-model';
import { PerplexityResource } from './PerplexityResource';
import { LanguageStringLoader, LanguageStrings } from './LanguageStrings';

const perplexityResource = new PerplexityResource();
const languageLoader = new LanguageStringLoader();

/**
 * Helper function to get localized strings from the request
 */
function getLocalizedStrings(handlerInput: Alexa.HandlerInput): LanguageStrings {
    const locale = handlerInput.requestEnvelope.request.locale || 'en-US';
    return languageLoader.getStrings(locale);
}

/**
 * Handler for LaunchRequest - when user opens the skill without a specific intent
 */
const LaunchRequestHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput: Alexa.HandlerInput): Response {
        const speakOutput = getLocalizedStrings(handlerInput).WELCOME_MESSAGE;

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
        const strings = getLocalizedStrings(handlerInput);

        if (!query) {
            return handlerInput.responseBuilder
                .speak(strings.QUERY_NOT_UNDERSTOOD)
                .reprompt(strings.QUERY_PROMPT)
                .getResponse();
        }

        try {
            const response = await perplexityResource.query(query);
            const speakOutput = response || strings.NO_ANSWER_FOUND;

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(strings.ANOTHER_QUESTION_PROMPT)
                .getResponse();
        } catch (error) {
            console.error('Error querying Perplexity:', error);

            return handlerInput.responseBuilder
                .speak(strings.ERROR_MESSAGE)
                .reprompt(strings.QUERY_PROMPT)
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
        const speakOutput = getLocalizedStrings(handlerInput).HELP_MESSAGE;

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
        const speakOutput = getLocalizedStrings(handlerInput).GOODBYE_MESSAGE;

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
        const strings = getLocalizedStrings(handlerInput);

        return handlerInput.responseBuilder
            .speak(strings.FALLBACK_MESSAGE)
            .reprompt(strings.QUERY_PROMPT)
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
        const speakOutput = getLocalizedStrings(handlerInput).GENERIC_ERROR;
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

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
