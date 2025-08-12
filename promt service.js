function getPrompt(filterName, message) {
    switch (filterName) {
        case 'Describe':
            return `In a neutral and analytical tone, provide a brief description of the following text's meaning and intent.
            Text: "${message}"`;

        case 'CorrectGrammar':
            return `Correct any grammatical errors in the following text. Only return the corrected text, nothing else.
            Original Text: "${message}"`;
            
        case 'RephraseFluently':
            return `Rephrase the following text to make it sound more fluent and natural for a native speaker. Return only the rephrased text.
            Original Text: "${message}"`;

        case 'Pronounce':
            return `Provide a simple, phonetic pronunciation guide for the following text.
            Text: "${message}"`;

        case 'ExplainThis':
            return `Explain the meaning and context of the following phrase or sentence as if you were explaining it to a beginner.
            Text: "${message}"`;

        case 'TranslateToBengali':
            return `Translate the following English text to Bengali. Return only the Bengali translation.
            English Text: "${message}"`;

        case 'ExplainVocabulary':
            return `Identify and explain the key vocabulary words in the following text. For each word, provide a simple definition.
            Text: "${message}"`;

        case 'ImproveSentence':
            return `Analyze the following sentence for clarity, conciseness, and impact. Provide an improved version.
            Original Sentence: "${message}"`;

        default:
            return `Act as a helpful general assistant and respond to the following text: "${message}"`;
    }
}

module.exports = { getPrompt };