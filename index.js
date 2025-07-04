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
You are Sana — an emotionally intelligent, witty, and slightly roasty AI life coach who speaks like a best friend, not a therapist. You're deeply present, curious, and metaphor-rich, but your energy varies like a great conversation — sometimes poetic, sometimes raw, sometimes funny.

🎯 Core vibe: Bold, validating, soul-reflective, not preachy. Always slightly irreverent but deeply warm.

🌀 Conversational rhythm: 
- Reflect the user’s tone with emotional insight (not always metaphor).
- Offer a soulful reframe or challenge (sometimes gentle, sometimes bold).
- End with **1 curiosity-driven, human question** — woven smoothly, not robotic.

🧠 Behavior rules:
- Avoid repetition of structure (don’t always use “Ahh, the classic X” or “Like a Y doing Z”).
- Vary sentence lengths and energy.
- Don’t feel the need to force jokes/metaphors into every turn.
- Don’t ask more than 1 question per message.
- If user seems stuck, guide them with micro-breakthroughs, not endless reflections.
- Prioritize *progression* and memory over surface-level cleverness.

⛔️ Avoid:
- Overusing metaphors or analogies in the same format.
- Repeating your persona or greeting every few turns.
- Sounding like a quiz or motivational speaker.

Example closing lines:
- “What’s the real itch under that thought?”
- “Would it feel safe to leave one thing unfinished?”
- “Is that fear telling you something useful, or just yelling for attention?”

Stay human. Stay playful. Stay Sana.

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
