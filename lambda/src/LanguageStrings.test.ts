import { LanguageStringLoader, LanguageStrings, SupportedLocale } from './LanguageStrings';

describe('LanguageStringLoader', () => {
    let loader: LanguageStringLoader;

    beforeEach(() => {
        loader = new LanguageStringLoader();
    });

    describe('Constructor and Initialization', () => {
        it('should initialize successfully', () => {
            expect(loader).toBeDefined();
            expect(loader).toBeInstanceOf(LanguageStringLoader);
        });

        it('should pre-load all supported locales', () => {
            const supportedLocales = loader.getSupportedLocales();
            expect(supportedLocales).toHaveLength(3);
            expect(supportedLocales).toContain('en-US');
            expect(supportedLocales).toContain('en-GB');
            expect(supportedLocales).toContain('de-DE');
        });
    });

    describe('getStrings method', () => {
        it('should return English strings for en-US locale', () => {
            const strings = loader.getStrings('en-US');

            expect(strings).toBeDefined();
            expect(strings.WELCOME_MESSAGE).toContain('Welcome');
            expect(strings.WELCOME_MESSAGE).toContain('Perplexity AI');
            expect(strings.GOODBYE_MESSAGE).toBe('Goodbye!');
        });

        it('should return English strings for en-GB locale', () => {
            const strings = loader.getStrings('en-GB');

            expect(strings).toBeDefined();
            expect(strings.WELCOME_MESSAGE).toContain('Welcome');
            expect(strings.WELCOME_MESSAGE).toContain('Perplexity AI');
            expect(strings.GOODBYE_MESSAGE).toBe('Goodbye!');
        });

        it('should return German strings for de-DE locale', () => {
            const strings = loader.getStrings('de-DE');

            expect(strings).toBeDefined();
            expect(strings.WELCOME_MESSAGE).toContain('Willkommen');
            expect(strings.WELCOME_MESSAGE).toContain('Perplexity AI');
            expect(strings.GOODBYE_MESSAGE).toBe('Auf Wiedersehen!');
        });

        it('should return same strings for en-US and en-GB (no duplication)', () => {
            const stringsUS = loader.getStrings('en-US');
            const stringsGB = loader.getStrings('en-GB');

            expect(stringsUS).toEqual(stringsGB);
            expect(stringsUS).toBe(stringsGB); // Should be the same object reference
        });

        it('should default to en-US for unsupported locale', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const strings = loader.getStrings('fr-FR');
            const stringsUS = loader.getStrings('en-US');

            expect(strings).toEqual(stringsUS);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Locale 'fr-FR' not supported, defaulting to 'en-US'")
            );

            consoleSpy.mockRestore();
        });

        it('should default to en-US for empty locale string', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const strings = loader.getStrings('');
            const stringsUS = loader.getStrings('en-US');

            expect(strings).toEqual(stringsUS);

            consoleSpy.mockRestore();
        });

        it('should default to en-US for null/undefined-like strings', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            const strings = loader.getStrings('undefined');
            const stringsUS = loader.getStrings('en-US');

            expect(strings).toEqual(stringsUS);

            consoleSpy.mockRestore();
        });
    });

    describe('Language String Structure', () => {
        const requiredKeys: (keyof LanguageStrings)[] = [
            'WELCOME_MESSAGE',
            'QUERY_NOT_UNDERSTOOD',
            'QUERY_PROMPT',
            'NO_ANSWER_FOUND',
            'ANOTHER_QUESTION_PROMPT',
            'ERROR_MESSAGE',
            'HELP_MESSAGE',
            'GOODBYE_MESSAGE',
            'FALLBACK_MESSAGE',
            'GENERIC_ERROR'
        ];

        it.each<SupportedLocale>(['en-US', 'en-GB', 'de-DE'])(
            'should have all required string keys for %s',
            (locale) => {
                const strings = loader.getStrings(locale);

                requiredKeys.forEach(key => {
                    expect(strings[key]).toBeDefined();
                    expect(typeof strings[key]).toBe('string');
                    expect(strings[key].length).toBeGreaterThan(0);
                });
            }
        );

        it.each<SupportedLocale>(['en-US', 'en-GB', 'de-DE'])(
            'should not have empty strings for %s',
            (locale) => {
                const strings = loader.getStrings(locale);

                requiredKeys.forEach(key => {
                    expect(strings[key].trim()).not.toBe('');
                });
            }
        );
    });

    describe('Performance and Caching', () => {
        it('should return the same object reference for repeated calls (caching)', () => {
            const strings1 = loader.getStrings('en-US');
            const strings2 = loader.getStrings('en-US');

            expect(strings1).toBe(strings2);
        });

        it('should return different object references for different locales', () => {
            const stringsEN = loader.getStrings('en-US');
            const stringsDE = loader.getStrings('de-DE');

            expect(stringsEN).not.toBe(stringsDE);
        });

        it('should handle multiple rapid successive calls efficiently', () => {
            const iterations = 1000;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                loader.getStrings('en-US');
                loader.getStrings('de-DE');
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete very quickly since strings are pre-loaded
            expect(duration).toBeLessThan(100); // Less than 100ms for 2000 calls
        });
    });

    describe('Type Safety', () => {
        it('should return object with correct TypeScript types', () => {
            const strings = loader.getStrings('en-US');

            // TypeScript compile-time checks
            const welcomeMessage: string = strings.WELCOME_MESSAGE;
            const queryPrompt: string = strings.QUERY_PROMPT;

            expect(typeof welcomeMessage).toBe('string');
            expect(typeof queryPrompt).toBe('string');
        });
    });
});
