import * as Alexa from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { AskPerplexityIntentHandler } from './AskPerplexityIntentHandler';
import { LanguageStringLoader, LanguageStrings } from './LanguageStrings';

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
 * Handler for AMAZON.NextIntent - continues reading chunked responses
 */
const NextIntentHandler: Alexa.RequestHandler = {
    canHandle(handlerInput: Alexa.HandlerInput): boolean {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NextIntent';
    },
    handle(handlerInput: Alexa.HandlerInput): Response {
        const strings = getLocalizedStrings(handlerInput);
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

        // Check if there are stored response chunks
        const chunks = sessionAttributes.responseChunks as string[] | undefined;
        const currentIndex = sessionAttributes.currentChunkIndex as number | undefined;

        if (!chunks || currentIndex === undefined || currentIndex >= chunks.length - 1) {
            // No more content to read
            return handlerInput.responseBuilder
                .speak(strings.NO_MORE_CONTENT)
                .reprompt(strings.QUERY_PROMPT)
                .getResponse();
        }

        // Move to next chunk
        const nextIndex = currentIndex + 1;
        sessionAttributes.currentChunkIndex = nextIndex;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

        const nextChunk = chunks[nextIndex];

        // Check if this is the last chunk
        if (nextIndex >= chunks.length - 1) {
            // Last chunk - no continuation prompt
            return handlerInput.responseBuilder
                .speak(nextChunk)
                .reprompt(strings.ANOTHER_QUESTION_PROMPT)
                .getResponse();
        } else {
            // More chunks remaining - add continuation prompt
            const speakOutput = `${nextChunk} ${strings.CONTINUATION_PROMPT}`;
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(strings.CONTINUATION_PROMPT)
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
        NextIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('perplexity-alexa-skill/v1.0')
    .lambda();
