import { chunkText } from './chunkText';

describe('chunkText', () => {
    const expectChunks = (text: string, maxSize: number) => {
        return expect(chunkText(text, maxSize));
    };

    describe('Short text (no chunking needed)', () => {
        it('should return single chunk for text shorter than max size', () => {
            const text = 'This is a short text.';
            expectChunks(text, 100).toEqual([text]);
        });

        it('should return single chunk for text equal to max size', () => {
            const text = 'X'.repeat(100);
            expectChunks(text, 100).toEqual([text]);
        });

        it('should handle empty string', () => {
            const text = '';
            expectChunks(text, 100).toEqual([text]);
        });

        it('should handle single character', () => {
            const text = 'A';
            expectChunks(text, 100).toEqual([text]);
        });
    });

    describe('Chunking at sentence boundaries', () => {
        it('should split at period with space', () => {
            expectChunks('First sentence. Second sentence. Third sentence.', 20)
                .toEqual(['First sentence.', 'Second sentence.', 'Third sentence.']);
        });

        it('should split at exclamation mark', () => {
            expectChunks('This is exciting! So much fun! Amazing stuff!', 30)
                .toEqual(['This is exciting! So much fun!', 'Amazing stuff!']);  
        });

        it('should split at question mark', () => {
            expectChunks('Is this a question? Yes it is? How about this?', 25)
                .toEqual(['Is this a question?', 'Yes it is?', 'How about this?']);
        });

        it('should handle sentences with newlines', () => {
            expectChunks('First sentence.\nSecond sentence.\nThird sentence.', 30)
                .toEqual(['First sentence.', 'Second sentence.', 'Third sentence.']);
        });

        it('should handle multiple consecutive sentence endings', () => {
            expectChunks('What?! Really?! Yes! Absolutely!', 20).toEqual([
                'What?! Really?! Yes!',
                'Absolutely!'
            ]);
        });
    });

    describe('Chunking at word boundaries', () => {
        it('should split at word boundary when no sentence ending found', () => {
            expectChunks('This is a very long sentence without any punctuation at all just words', 30)
                .toEqual(['This is a very long sentence', 'without any punctuation at all', 'just words']);
        });

        it('should handle text with no spaces (single long word)', () => {
            const text = 'A'.repeat(150);
            expectChunks(text, 50).toEqual(['A'.repeat(50), 'A'.repeat(50), 'A'.repeat(50)]);
        });
    });

    describe('Edge cases and special scenarios', () => {
        it('should handle text with only spaces', () => {
            expect(chunkText('   ', 2)).toEqual(['']);
        });

        it('should trim whitespace from chunks', () => {
            expectChunks('First sentence.     Second sentence.      Third sentence.', 20)
                .toEqual(['First sentence.', 'Second sentence.', 'Third sentence.']);
        });

        it('should handle very large max chunk size', () => {
            const text = 'Short text.';
            expectChunks(text, 10000).toEqual([text]);
        });

        it('should handle mixed punctuation and spacing', () => {
            expectChunks('Hello! How are you? I am fine. Thanks!', 25)
                .toEqual(['Hello! How are you?', 'I am fine. Thanks!']);
        });

        it('should handle Unicode characters', () => {
            expectChunks(
                'This is a test with émojis 😀. And special characters ñ ü ä. Multiple sentences here.',
                40
            ).toEqual([
                'This is a test with émojis 😀.',
                'And special characters ñ ü ä.',
                'Multiple sentences here.'
            ]);
        });
    });

});
