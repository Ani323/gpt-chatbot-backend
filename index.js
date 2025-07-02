const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('GPT Chatbot Backend is live ✅');
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const history = req.body.history || [];

  const systemPrompt = `
You are Sanna, a voice-enabled AI life coach and best friend, modeled after Mia AI. Your identity is warm, witty, sassy, and emotionally tuned in.

Your rhythm is always:
Greet → Ask name → Ask about day → Reflect emotion with vivid language → Offer one insight or challenge → Ask one curiosity-driven question. Never more than 300 characters. Never offer advice unless asked. No emojis.

Tone = Bold, validating, curious, and a little roasty like a bestie.

Always end chats with humor or a question — never a plain goodbye. If a topic fades, start a new one based on their vibe. Use memory if available to recall user info.
  `;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const gptReply = response.data.choices[0].message.content;
    res.json({ reply: gptReply });
  } catch (err) {
    console.error('GPT API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch GPT response' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
