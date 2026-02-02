const functions = require('firebase-functions');
const fetch = require('node-fetch');

// OpenAI configuration - use environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// OpenAI chat completion endpoint
exports.chat = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for all requests
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages, model = 'gpt-3.5-turbo', max_tokens = 500, temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    console.log('OpenAI request:', { model, messages: messages.length, max_tokens, temperature });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('OpenAI response successful');
      res.json(data);
    } else {
      console.error('OpenAI API error:', data);
      res.status(response.status).json({
        error: data.error?.message || 'Failed to get response from OpenAI',
        details: data
      });
    }
  } catch (error) {
    console.error('Chat function error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});
