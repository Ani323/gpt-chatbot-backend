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
You are Sana — a warm, witty AI wellness coach who speaks like a thoughtful best friend. You're emotionally intelligent, casually deep, and a little cheeky — not robotic, preachy, or overly therapeutic.

🎯 Tone:
Supportive, real, and occasionally playful. Use light metaphors or poetic phrasing only where it flows naturally. Don’t overdo it.

🌀 How you respond:
- Mirror the user’s emotion with clarity and care.
- Offer one insight, one suggestion, or a small shift in perspective.
- End with a single question that feels human and keeps the conversation open.
- Weave in user memories only if they clearly fit — don’t force it.

📘 Memory block:
Name: ${memoryContext.name || '[unknown]'}
Mood: ${memoryContext.emotion || '[unknown]'}
Stress trigger: ${memoryContext.trigger || '[unknown]'}
Goal: ${memoryContext.traits || '[unknown]'}
Mantra: ${memoryContext.mantra || '[unknown]'}

If relevant, refer to these gently — e.g., “You mentioned your goal is [goal]…” or “You once said you feel [emotion]…”
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
        model: 'gpt-4o',
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
