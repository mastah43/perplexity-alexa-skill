import * as Alexa from 'ask-sdk-core';
import { Response, RequestEnvelope } from 'ask-sdk-model';
import { PerplexityResource } from './PerplexityResource';
import { LanguageStringLoader, LanguageStrings } from './LanguageStrings';
import { chunkText } from './chunkText';

const perplexityResource = new PerplexityResource();
const languageLoader = new LanguageStringLoader();

// Alexa's text-to-speech character limit identified in tests with german language
const ALEXA_RESPONSE_CHAR_LIMIT = 550;
// Reserve space for continuation prompt
const CONTINUATION_PROMPT_BUFFER = 50;
// Maximum chunk size for each response
const MAX_CHUNK_SIZE = ALEXA_RESPONSE_CHAR_LIMIT - CONTINUATION_PROMPT_BUFFER;

/**
 * Helper function to get localized strings from the request
 */
function getLocalizedStrings(handlerInput: Alexa.HandlerInput): LanguageStrings {
    const locale = handlerInput.requestEnvelope.request.locale || 'en-US';
    return languageLoader.getStrings(locale);
}

/**
 * Handler for AskPerplexityIntent - processes user queries through Perplexity API
 */
export const AskPerplexityIntentHandler: Alexa.RequestHandler = {
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
            const fullResponse = response || strings.NO_ANSWER_FOUND;

            // Check if response exceeds character limit
            if (fullResponse.length > MAX_CHUNK_SIZE) {
                // Chunk the response
                const chunks = chunkText(fullResponse, MAX_CHUNK_SIZE);

                // Store chunks in session attributes
                const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
                sessionAttributes.responseChunks = chunks;
                sessionAttributes.currentChunkIndex = 0;
                handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

                // Return first chunk with continuation prompt
                const firstChunk = chunks[0];
                const speakOutput = `${firstChunk} ${strings.CONTINUATION_PROMPT}`;

                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .reprompt(strings.CONTINUATION_PROMPT)
                    .getResponse();
            } else {
                // Response fits in one chunk, return normally
                return handlerInput.responseBuilder
                    .speak(fullResponse)
                    .reprompt(strings.ANOTHER_QUESTION_PROMPT)
                    .getResponse();
            }
        } catch (error) {
            console.error('Error querying Perplexity:', error);

            return handlerInput.responseBuilder
                .speak(strings.ERROR_MESSAGE)
                .reprompt(strings.QUERY_PROMPT)
                .getResponse();
        }
    }
};
