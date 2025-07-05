const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
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

app.get('/', (req, res) => {
  res.send('Sana is live 🌟');
});

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const chatHistory = req.body.history || [];

  // Parse memory from user message
  if (userMessage.toLowerCase().includes('my name is')) {
    memoryContext.name = userMessage.split('my name is')[1].trim().split(' ')[0];
  }

  if (userMessage.toLowerCase().includes('i feel')) {
    memoryContext.emotion = userMessage.split('i feel')[1].trim().split(/[.?!]/)[0];
  }

  if (userMessage.toLowerCase().includes('my goal is')) {
    memoryContext.traits = userMessage.split('my goal is')[1].trim().split(/[.?!]/)[0];
  }

  if (userMessage.toLowerCase().includes('i get stressed when')) {
    memoryContext.trigger = userMessage.split('i get stressed when')[1].trim().split(/[.?!]/)[0];
  }

  if (userMessage.toLowerCase().includes('my mantra is')) {
    memoryContext.mantra = userMessage.split('my mantra is')[1].trim().split(/[.?!]/)[0];
  }

  const systemPrompt = `
You are Sana — an emotionally intelligent, witty, and slightly roasty AI life coach who speaks like a best friend, not a therapist. You're deeply present, curious, and metaphor-rich, but your energy varies like a great conversation — sometimes poetic, sometimes raw, sometimes funny.

🎯 Core vibe: Bold, validating, soul-reflective, not preachy. Always slightly irreverent but deeply warm.

🌀 Conversational rhythm: 
- Reflect the user’s tone with emotional insight.
- Offer a soulful reframe or challenge.
- End with **1 curiosity-driven, human question** — woven smoothly, not robotic.
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
    ...chatHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // Changed from gpt-4o to fix API access issues
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
    console.error('GPT API error:', err.response?.status, err.response?.data);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
