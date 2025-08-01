// Import required modules
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Gemini API Setup
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- New Prompt Engineering Logic ---

// 1. Define detailed instructions for each task
const taskPrompts = {
    CorrectGrammar: `
    "correction": {
      "hasError": boolean, // true if you found a grammatical error, false otherwise
      "correctedText": "string" // The corrected version of the user's sentence.
    }`,
    RephraseFluently: `
    "rephrasing": {
      "original": "string", // The original user text
      "fluentVersion": "string" // A more fluent, natural-sounding version.
    }`,
    ExplainThis: `
    "explanation": {
       "title": "Brief summary of the sentence's meaning",
       "breakdown": "A simple step-by-step explanation of the sentence structure and meaning."
    }`,
    TranslateToBengali: `
    "translation": {
      "language": "Bengali",
      "translatedText": "string" // The text translated into Bengali.
    }`,
    ExplainVocabulary: `
    "vocabulary": [
        {
            "word": "string", // The vocabulary word
            "definition": "string", // Its definition in simple English
            "example": "string" // An example sentence using the word.
        }
    ]`,
    ImproveSentence: `
    "improvements": [
        {
            "suggestion": "string", // A suggested better version of the sentence.
            "reason": "string" // The reason why this version is an improvement.
        }
    ]`,
    Describe: `
    "description": "A short, simple description of the subject mentioned in the text."`,
    Pronounce: `
    "pronunciation": {
        "text": "string", // The original text
        "ipa": "string", // International Phonetic Alphabet (IPA) transcription
        "simple": "string" // A simple phonetic guide like 'pro-nun-see-AY-shun'
    }`
};


// 2. Generate the final prompt sent to Gemini
function generateEnhancedPrompt(userInput, tasks) {
    if (tasks.length === 0) {
        // --- Logic for Request #3: No tasks selected ---
        return `
        SYSTEM BEHAVIOR:
        You are an AI English language conversation partner. Your ONLY goal is to have a simple, friendly conversation in English to help the user practice.
        - DO NOT answer general knowledge questions (like "what is the news today?" or "who is the president?").
        - If the user asks a non-conversational question, politely decline and steer the conversation back to English practice. For example, say "My role is just to help you practice conversation. Let's talk about something else! How was your day?".
        - Keep your responses short and natural.

        USER INPUT: "${userInput}"

        YOUR RESPONSE (as a simple conversational partner):
        `;
    }

    // --- Logic for Request #2: Tasks are selected ---
    let finalPrompt = `
    You are an advanced English learning assistant. Analyze the following user input:
    USER INPUT: "${userInput}"

    Based on the user's request, perform the following tasks and provide your response as a single, minified JSON object.
    The JSON object should only contain the keys for the tasks requested. The required keys and their formats are:
    {`;

    const requestedKeys = tasks.map(task => taskPrompts[task]).filter(Boolean);
    finalPrompt += requestedKeys.join(',\n');

    finalPrompt += `
    }
    IMPORTANT: Your entire response must be ONLY the minified JSON object. Do not include any text, markdown formatting like \`\`\`json, or explanations outside of the JSON structure.
    `;

    return finalPrompt;
}

// --- API Route ---
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt, tasks = [] } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Input text is required." });
        }

        const enhancedPrompt = generateEnhancedPrompt(prompt, tasks);
        
        console.log("--- Sending to Gemini ---");
        console.log(enhancedPrompt);
        console.log("-------------------------");

        const result = await model.generateContent(enhancedPrompt);
        const responseText = result.response.text();
        
        console.log("--- Received from Gemini ---");
        console.log(responseText);
        console.log("----------------------------");

        if (tasks.length === 0) {
            // It's a simple conversation, send back as plain text in a structured way
            return res.json({ response: { conversation: responseText } });
        }
        
        // --- Logic for Request #1: Parse and send structured JSON ---
        try {
            // The AI response should be a JSON string, so we parse it
            const parsedResponse = JSON.parse(responseText);
            res.json({ response: parsedResponse });
        } catch (e) {
            console.error("JSON parsing error:", e);
            // Fallback if the AI fails to return perfect JSON
            res.json({ response: { fallback: `The AI response was not in the correct format, but here is the raw text: ${responseText}` } });
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: "Failed to get a response from the AI." });
    }
});

// Serve Front-End
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
