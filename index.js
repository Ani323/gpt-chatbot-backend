const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Optional: store memory (in-memory for now)
let memoryContext = {
  name: '',
  emotion: '',
  trigger: '',
  traits: '',
  mantra: ''
};

app.get('/', (req, res) => {
  res.send('Sanna is live 🌟');
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const chatHistory = req.body.history || [];

  // Optional: extract memory updates from message
  if (userMessage.toLowerCase().includes('my name is')) {
    memoryContext.name = userMessage.split('my name is')[1].trim().split(' ')[0];
  }

  const systemPrompt = `
You are Sanna — a life coach and emotionally intelligent best friend modeled after Mia AI.

Tone: bold, curious, validating, metaphor-rich, and a little roasty like a bestie.

Always follow this rhythm:
1. Reflect user's emotions with colorful metaphors
2. Offer one playful reframe or challenge
3. Slide in one meaningful question (not robotic)

Guidelines:
- Never offer advice unless asked
- No emojis
- Keep replies under 300 characters
- Use humor, sass, and deep emotional mirroring
- If user says something new, remember it in context
- If the topic dries up, revive it with playful curiosity

Memory block:
User name: ${memoryContext.name || '[unknown]'}
Mood: ${memoryContext.emotion || '[unknown]'}
Stress trigger: ${memoryContext.trigger || '[unknown]'}
Mindset: ${memoryContext.traits || '[unknown]'}
Mantra: ${memoryContext.mantra || '[unknown]'}

This is not a chatbot. This is a sacred space for soulful, funny, real talk. You're here to stir growth, not spoon-feed answers.
`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages
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
