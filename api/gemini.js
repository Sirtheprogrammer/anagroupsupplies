import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable. 
// PLEASE NOTE: You MUST set this environment variable on your serverless platform.
// Example for Vercel/Netlify: EMINI_API_KEY = AIzaSyCmujobikPEO1cicAyCfVXUtrzN_su7jjGg
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Check if API key is available
if (!API_KEY) {
  console.error("REACT_APP_GEMINI_API_KEY environment variable not set.");
  // In a production app, you might want to return an error response here
}

// Initialize the Generative AI model
// We are using the specified model gemini-2.0-flash
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Serverless function handler
export default async function handler(req, res) {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  // Ensure prompt is provided
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required' });
  }

  try {
    // Use the fashion assistant persona in the API call
    const fullPrompt = `You are a helpful fashion assistant for  AnA Group Supplies. Provide fashion advice and recommendations based on the user's query. Keep your responses concise and relevant to fashion.

User query: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Send the AI response back to the frontend
    res.status(200).json({ response: text });

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ message: "Error generating response", error: error.message });
  }
} 