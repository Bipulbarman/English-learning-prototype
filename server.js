const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("API_KEY not found. Please set it in your environment variables.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
async function callGemini(filterName, prompt) {
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return { filter: filterName, content: text };
    } catch (error) {
        console.error(`Error calling Gemini API for filter: ${filterName}`, error);
        return { filter: filterName, content: `Error generating response for this filter. Please try again.` };
    }
}

app.post('/api/chat', async (req, res) => {
    try {
        const { requests } = req.body;

        if (!requests || !Array.isArray(requests) || requests.length === 0) {
            return res.status(400).json({ error: 'Invalid request: A non-empty "requests" array is required.' });
        }
        
        // Map over the array of requests and call the Gemini API for each one.
        const apiCalls = requests.map(reqObj => callGemini(reqObj.filter, reqObj.prompt));
        const results = await Promise.all(apiCalls);
        res.json(results);
    } catch (error) {
        console.error('Error in /api/chat endpoint:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});

app.get('/', (req, res) => {
    res.send('Gemini Chat Backend is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
