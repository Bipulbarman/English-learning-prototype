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

app.get('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.query;

        if (!prompt) {
            return res.status(400).json({ error: 'Invalid request: "prompt" query parameter is required.' });
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        res.send(text);

    } catch (error) {
        console.error('Error in /api/chat proxy endpoint:', error);
        res.status(500).json({ error: 'An internal server error occurred while contacting the AI service.' });
    }
});

app.get('/', (req, res) => {
    res.send('Gemini Chat Backend Proxy is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
