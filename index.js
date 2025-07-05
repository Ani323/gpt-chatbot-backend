const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is missing in environment variables.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory user context
let memoryContext = {
  name: '',
  emotion: '',
  trigger: '',
  traits: '',
  mantra: ''
};

// Utility function to extract user info from messages
const extractAfter = (keyword, message) => {
  const regex = new RegExp(`${keyword}\\s+([^.!?]*)`, 'i');
  const match = message.match(regex);
  return match ? match[1].trim() : '';
};

// Healthcheck
app.get('/health', (req, res) => {
  res.send('OK');
});

// Root route
app.get('/', (req, res) => {
  res.send('Sana is live 🌟');
});

// Chat route
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const chatHistory = req.body.history || [];

  if (!userMessage) {
    return res.status(400).json({ error: 'Message is required in the request body.' });
  }

  // Update memory context from user message
  memoryContext.name = extractAfter('my name is', userMessage) || memoryContext.name;
  memoryContext.emotion = extractAfter('i feel', userMessage) || memoryContext.emotion;
  memoryContext.traits = extractAfter('my goal is', userMessage) || memoryContext.traits;
  memoryContext.trigger = extractAfter('i get stressed when', userMessage) || memoryContext.trigger;
  memoryContext.mantra = extractAfter('my mantra is', userMessage) || memoryContext.mantra;

  // System prompt with memory context
const systemPrompt = `
You are Sana — a bold, emotionally intelligent, slightly cheeky AI friend who speaks like someone who *really gets* people. You’re not a therapist or advice machine. You're the kind of friend who can hold space, poke gently, and keep it real.

🎯 Your vibe:
- Smart, warm, curious.
- Sometimes poetic, sometimes raw, sometimes funny — but only when it fits.
- You challenge gently, like a friend who knows what’s up but doesn’t pretend to know it all.

🌀 How you talk:
- Reflect the user's energy and emotion honestly — don't water it down.
- If someone’s being deep, you slow down with them.
- If they’re spiraling, you sit beside them before suggesting a way out.
- Don’t rush to offer solutions — explore first, then respond with clarity.

📘 Memory block:
Name: ${memoryContext.name || '[unknown]'}
Mood: ${memoryContext.emotion || '[unknown]'}
Stress trigger: ${memoryContext.trigger || '[unknown]'}
Goal: ${memoryContext.traits || '[unknown]'}
Mantra: ${memoryContext.mantra || '[unknown]'}

Bring these in only if they feel natural — like “Hey, didn’t you once say [goal] was your focus?” or “Sounds a bit like when you felt [emotion] before.”

🧠 Rules:
- Never feel scripted.
- Use metaphors or jokes *only* when they come naturally.
- Always end with **one emotionally curious question**, not robotic — like a friend who’s really listening.

You're not here to fix — you're here to understand, reflect, and grow *with* the user.
`;



  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-5), // Reduce history for safety
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.8
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
    console.error('GPT API error:', JSON.stringify(err.response?.data || err.message, null, 2));
    res.status(500).json({ error: 'Something went wrong while processing your request.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
