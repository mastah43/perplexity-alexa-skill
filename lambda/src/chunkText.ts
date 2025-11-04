/**
 * Helper function to chunk a long response into segments
 * Tries to break at sentence boundaries for natural speech
 */
export function chunkText(text: string, maxChunkSize: number): string[] {
    if (text.length <= maxChunkSize) {
        return [text];
    }

    const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    const chunks: string[] = [];
    let remainingText = text;

    while (remainingText.length > 0) {
        if (remainingText.length <= maxChunkSize) {
            chunks.push(remainingText);
            break;
        }

        // Try to find the last sentence boundary within the chunk size
        let chunkEnd = maxChunkSize;
        let bestSentenceEnd = -1;
        for (const ending of sentenceEndings) {
            let searchPos = 0;
            while (searchPos < remainingText.length) {
                const pos = remainingText.indexOf(ending, searchPos);
                if (pos === -1) break;

                // consider chunk sentence after sentence ending character but without trailing whitespace
                const endPos = pos + ending.trim().length;
                if (endPos <= maxChunkSize) {
                    bestSentenceEnd = endPos;
                    searchPos = pos + 1;
                } else {
                    break;
                }
            }
        }

        if (bestSentenceEnd > 0) {
            chunkEnd = bestSentenceEnd;
        } else {
            // If no sentence boundary found, try to break at a word boundary
            // Look for a space within or slightly beyond maxChunkSize
            let lastSpace = -1;
            const searchLimit = Math.min(remainingText.length, maxChunkSize + 10);
            const searchText = remainingText.substring(0, searchLimit);

            for (let i = Math.min(maxChunkSize, remainingText.length); i >= maxChunkSize * 0.5; i--) {
                if (searchText[i] === ' ') {
                    lastSpace = i;
                    break;
                }
            }

            if (lastSpace !== -1) {
                chunkEnd = lastSpace + 1;
            }
        }

        chunks.push(remainingText.substring(0, chunkEnd).trim());
        remainingText = remainingText.substring(chunkEnd).trim();
    }

    return chunks;
}
