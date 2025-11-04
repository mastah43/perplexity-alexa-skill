/**
 * Type definitions for language-specific strings used in the Alexa skill
 */

/**
 * Interface defining all available language strings
 */
export interface LanguageStrings {
    WELCOME_MESSAGE: string;
    QUERY_NOT_UNDERSTOOD: string;
    QUERY_PROMPT: string;
    NO_ANSWER_FOUND: string;
    ANOTHER_QUESTION_PROMPT: string;
    ERROR_MESSAGE: string;
    HELP_MESSAGE: string;
    GOODBYE_MESSAGE: string;
    FALLBACK_MESSAGE: string;
    GENERIC_ERROR: string;
    CONTINUATION_PROMPT: string;
    NO_MORE_CONTENT: string;
}

/**
 * Supported locales for the skill
 */
export type SupportedLocale = 'en-US' | 'en-GB' | 'de-DE';

/**
 * Maps locale codes to their base language key in the JSON file
 * Both en-US and en-GB use the same 'en' strings
 */
const LOCALE_TO_LANGUAGE_MAP: Record<SupportedLocale, string> = {
    'en-US': 'en',
    'en-GB': 'en',
    'de-DE': 'de-DE'
};

/**
 * Language strings data structure loaded from JSON
 */
interface LanguageStringsData {
    en: LanguageStrings;
    'de-DE': LanguageStrings;
}

/**
 * Class responsible for loading and providing access to localized strings
 * Loads all language strings at initialization for efficient runtime access
 */
export class LanguageStringLoader {
    private languageData: LanguageStringsData;
    private languageStringsByLocale: Record<string, LanguageStrings>;

    constructor() {
        // Load language strings from JSON file once at initialization
        this.languageData = require('./languageStrings.json') as LanguageStringsData;

        // Pre-load all supported locales
        this.languageStringsByLocale = this.buildLanguageStringsByLocale();
    }

    /**
     * Build cache of all supported locales at initialization
     * @returns Record mapping locale codes to their language strings
     */
    private buildLanguageStringsByLocale(): Record<string, LanguageStrings> {
        const stringsByLocale: Record<string, LanguageStrings> = {};

        // Load all supported locales
        const supportedLocales: SupportedLocale[] = ['en-US', 'en-GB', 'de-DE'];
        for (const locale of supportedLocales) {
            const languageKey = LOCALE_TO_LANGUAGE_MAP[locale];
            stringsByLocale[locale] = this.languageData[languageKey as keyof LanguageStringsData];
        }

        return stringsByLocale;
    }

    /**
     * Get language strings for a specific locale
     * Returns pre-loaded strings without any file I/O
     * @param locale - The locale from the Alexa request (e.g., 'en-US', 'en-GB', 'de-DE')
     * @returns LanguageStrings object with all localized text
     */
    public getStrings(locale: string): LanguageStrings {
        // Return pre-loaded strings if available, otherwise default to en-US
        if (locale in this.languageStringsByLocale) {
            return this.languageStringsByLocale[locale];
        }

        console.log(`Locale '${locale}' not supported, defaulting to 'en-US'`);
        return this.languageStringsByLocale['en-US'];
    }

    /**
     * Get all supported locales
     * @returns Array of supported locale codes
     */
    public getSupportedLocales(): SupportedLocale[] {
        return Object.keys(this.languageStringsByLocale) as SupportedLocale[];
    }
}
