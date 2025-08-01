// Import required modules
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Loads environment variables from .env file

// Import the Google Generative AI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON request bodies
// Serve static files (your index.html, css, js) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Gemini API Setup ---
// Check if the API key is available
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// --- API Routes ---

// Define the API endpoint to handle requests from the front-end
app.post('/api/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }

        // Send the prompt to the Gemini model
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Send the generated text back to the front-end
        res.json({ response: text });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: "Failed to get a response from the AI." });
    }
});

// --- Serve Front-End ---

// A catch-all route to serve the index.html for any other request
// This is important for single-page applications
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
