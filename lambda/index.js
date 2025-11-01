const Alexa = require('ask-sdk-core');
const axios = require('axios');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to Perplexity AI! Ask me any question and I\'ll search for the answer.';
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const AskPerplexityIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskPerplexityIntent';
    },
    async handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const query = slots.query.value;
        
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

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can ask me any question and I\'ll search for the answer using Perplexity AI. For example, you can say "Ask me about the weather" or "What is artificial intelligence?"';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. You can ask me any question and I\'ll search for the answer.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('What would you like to know?')
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

async function queryPerplexity(query) {
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
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
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

exports.handler = Alexa.SkillBuilders.custom()
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