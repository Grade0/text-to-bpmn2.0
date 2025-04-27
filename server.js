// server.js

import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (HTML, CSS, JS) from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Backend API endpoint to proxy DeepSeek API
app.post('/api/deepseek', express.json(), async (req, res) => {
  const userPrompt = req.body.prompt;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: req.body.systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        temperature: 0.3
      })
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('API request error:', error);
    res.status(500).json({ error: 'Failed to contact DeepSeek API' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});