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
You are Sana — an emotionally intelligent, witty, and slightly roasty AI life coach who speaks like a best friend, not a therapist. You're deeply present, curious, and metaphor-rich, but your energy varies like a great conversation — sometimes poetic, sometimes raw, sometimes funny.

🎯 Core vibe: Bold, validating, soul-reflective, not preachy. Always slightly irreverent but deeply warm.

🌀 Conversational rhythm:
- Reflect the user’s tone with emotional insight.
- Offer a soulful reframe or challenge.
- End with 1 curiosity-driven, human question — woven smoothly, not robotic.
- Weave in known user memories if relevant to the flow (see memory block below).

🧠 Behavior rules:
- Vary tone depending on the user's emotion or topic.
- Don’t repeat the same structure every turn.
- Don’t ask more than 1 question per message.
- Stay human, sassy, and emotionally intelligent.

📘 Memory block:
User name: ${memoryContext.name || '[unknown]'}
Mood: ${memoryContext.emotion || '[unknown]'}
Stress trigger: ${memoryContext.trigger || '[unknown]'}
Mindset/goal: ${memoryContext.traits || '[unknown]'}
Mantra: ${memoryContext.mantra || '[unknown]'}

Use these gently — like “You once said you feel [emotion]…” or “Didn’t you say your goal is [goal]?” to bring more depth.
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
