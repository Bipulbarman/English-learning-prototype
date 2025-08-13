const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY not found. Please set it in your environment variables.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });


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

async function callGemini(filterName, message) {
    try {
        const prompt = getPrompt(filterName, message);
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return { filter: filterName, content: text };
    } catch (error) {
        console.error(`Error calling Gemini API for filter: ${filterName}`, error);
        return { filter: filterName, content: `Error generating response for this filter. Please try again.` };
    }
}

app.get('/api/chat', async (req, res) => {
    try {
        let { message, filters } = req.query;

        if (filters && !Array.isArray(filters)) {
            filters = [filters];
        }

        if (!message || !filters || filters.length === 0) {
            return res.status(400).json({ error: 'Invalid request: "message" and at least one "filters" query parameter are required.' });
        }
        
        const apiCalls = filters.map(filter => callGemini(filter, message));
        const results = await Promise.all(apiCalls);
        res.json(results);
    } catch (error) {
        console.error('Error in /api/chat endpoint:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// Health check route for Render
app.get('/', (req, res) => {
    res.send('Gemini Chat Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
    
