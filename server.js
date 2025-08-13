const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize the Google Generative AI client
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("API_KEY not found in environment variables. The server will not start.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * Simplified API Endpoint with detailed logging
 * It expects a 'prompt' query parameter and returns a raw text response.
 */
app.get('/api/chat', async (req, res) => {
    console.log(`[LOG] Received request at: ${new Date().toISOString()}`);
    console.log(`[LOG] Query parameters received:`, req.query);

    try {
        const { prompt } = req.query;

        if (!prompt) {
            console.error('[ERROR] Request failed: "prompt" query parameter was missing.');
            // Send plain text for errors, consistent with success response
            return res.status(400).send('Error: Invalid request. The "prompt" query parameter is required.');
        }
        
        console.log(`[LOG] Generating content for prompt starting with: "${prompt.substring(0, 90)}..."`);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        
        console.log('[LOG] Successfully generated and sent response.');
        res.send(text);

    } catch (error) {
        console.error('!!--- CRITICAL SERVER ERROR ---!!');
        console.error('A critical error occurred while trying to contact the Gemini API.');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        // This will log detailed info if the error is from the Gemini API client
        if (error.response) {
             console.error('Underlying Gemini API Response Error:', error.response);
        }
        console.error('Full Error Object:', JSON.stringify(error, null, 2));

        res.status(500).send('An internal server error occurred while contacting the AI service. Please check the server logs for more details.');
    }
});

// Health check route
app.get('/', (req, res) => {
    res.send('Gemini Chat Backend Proxy is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
