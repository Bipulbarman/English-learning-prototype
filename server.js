const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads the .env file for local development

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPrompt } = require('./promptService'); // ✅ fixed file name

const app = express();
// MODIFICATION: Use Render's port or 3000 for local dev
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Gemini API Initialization ===
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("API_KEY not found. Please set it in your environment variables.");
    process.exit(1); // Exit if no API key
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


// === Helper function to call Gemini API ===
async function callGemini(filterName, message) {
    try {
        const prompt = getPrompt(filterName, message);
        const result = await model.generateContent(prompt);
        const text = result.response.text(); // ✅ fixed usage
        return {
            filter: filterName,
            content: text
        };
    } catch (error) {
        console.error(`Error calling Gemini API for filter: ${filterName}`, error);
        return {
            filter: filterName,
            content: `Error generating response for this filter. Please try again.`
        };
    }
}

// === API Endpoint for Chat ===
app.post('/api/chat', async (req, res) => {
    try {
        const { message, filters } = req.body;

        if (!message || !Array.isArray(filters) || filters.length === 0) {
            return res.status(400).json({ error: 'Invalid request: "message" and a non-empty "filters" array are required.' });
        }
        
        const apiCalls = filters.map(filter => callGemini(filter, message));
        const results = await Promise.all(apiCalls);
        res.json(results);

    } catch (error) {
        console.error('Error in /api/chat endpoint:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

// MODIFICATION: Add a root route for Render's health check
app.get('/', (req, res) => {
    res.send('Gemini Chat Backend is running!');
});


// === Start the Server ===
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
